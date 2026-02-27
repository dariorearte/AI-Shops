import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  // --- ESTADOS DE SESIÓN Y PERFIL ---
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [activeMode, setActiveMode] = useState('shopper'); // shopper, shop, ryder
  
  // --- ESTADOS DE TIENDA (MODO SHOP) ---
  const [myProducts, setMyProducts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // --- ESTADOS DE COMPRA (MODO SHOPPER) ---
  const [allStores, setAllStores] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  // --- ESTADOS DE LOGÍSTICA (MODO RYDER) ---
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [currentRoute, setCurrentRoute] = useState(null);

  // --- INTERFAZ N.E.O.N. ---
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchInitialData(session.user.id);
        subscribeToRealtime(session.user.id);
      }
    });
  }, []);

  const fetchInitialData = async (userId) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', userId).single();
    const { data: w } = await supabase.from('wallets').select('*').eq('id', userId).single();
    const { data: s } = await supabase.from('tiendas').select('*');
    const { data: o } = await supabase.from('pedidos').select('*').or(`shopper_id.eq.${userId},seller_id.eq.${userId},driver_id.eq.${userId}`);
    
    if (p) { setProfile(p); setActiveMode(p.rol || 'shopper'); }
    if (w) setWallet(w);
    setAllStores(s || []);
    setOrders(o || []);
  };

  const subscribeToRealtime = (userId) => {
    supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
        fetchInitialData(userId); // Recargar datos si hay cambios en pedidos
      })
      .subscribe();
  };
  // --- A: MODO SHOP (CARGA DE PRODUCTOS) ---
  const uploadProduct = async (productData) => {
    setIsUploading(true);
    const { error } = await supabase.from('tiendas').insert([{
      ...productData,
      seller_id: session.user.id,
      ubicacion: profile.ubicacion // Hereda ubicación del perfil
    }]);
    if (!error) {
      speak("Producto integrado al catálogo de N.E.O.N., señor.");
      fetchInitialData(session.user.id);
    }
    setIsUploading(false);
  };

  // --- C: MODO SHOPPER (COMPRA CON ESCROW) ---
  const processPurchase = async () => {
    if (cart.length === 0) return speak("Su carrito está vacío, señor.");
    const total = cart.reduce((acc, item) => acc + parseFloat(item.precio.replace('$', '')), 0);

    if (wallet.saldo_disponible < total) return speak("Saldo insuficiente en su Neon Wallet.");

    // Iniciar transacción de Escrow
    const { data: order, error } = await supabase.from('pedidos').insert([{
      shopper_id: session.user.id,
      items: cart,
      total: total,
      estado: 'pendiente',
      pin_verificacion: Math.floor(1000 + Math.random() * 9000).toString()
    }]).select().single();

    if (!error) {
      // Retener dinero en la Wallet
      await supabase.from('wallets').update({
        saldo_disponible: wallet.saldo_disponible - total,
        saldo_retenido: wallet.saldo_retenido + total
      }).eq('id', session.user.id);

      setCart([]);
      speak("Pago retenido en Escrow. N.E.O.N. está buscando un Ryder para su entrega.");
      setView('home');
    }
  };

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text); u.lang = 'es-AR'; u.pitch = 0.8;
    window.speechSynthesis.speak(u);
  };

  const switchMode = async (newMode) => {
    await supabase.from('perfiles').update({ rol: newMode }).eq('id', session.user.id);
    setActiveMode(newMode);
    setIsFlipped(false);
    speak(`Modo ${newMode} activado.`);
  };
  return (
    <div style={styles.container}>
      {/* N.E.O.N. ID CARD (GIRATORIA) */}
      <div style={styles.cardContainer}>
        <motion.div onClick={() => setIsFlipped(!isFlipped)} animate={{ rotateY: isFlipped ? 180 : 0 }} style={styles.idCard}>
          {!isFlipped ? (
            <div style={styles.cardFront}>
              <div style={styles.rangoBadge}>{profile?.rango || 'BRONCE'}</div>
              <h2 style={styles.userName}>{profile?.nombre || 'USER'}</h2>
              <div style={styles.walletInfo}>
                <p>SALDO: ${wallet?.saldo_disponible || '0.00'}</p>
                <div style={styles.miniProgress}></div>
              </div>
            </div>
          ) : (
            <div style={styles.cardBack}>
               <div style={styles.modeGrid}>
                  <button onClick={(e) => { e.stopPropagation(); switchMode('shopper'); }} style={activeMode === 'shopper' ? styles.activeModeBtn : styles.modeBtn}>SHOPPER</button>
                  <button onClick={(e) => { e.stopPropagation(); switchMode('shop'); }} style={activeMode === 'shop' ? styles.activeModeBtn : styles.modeBtn}>MODO SHOP</button>
                  <button onClick={(e) => { e.stopPropagation(); switchMode('ryder'); }} style={activeMode === 'ryder' ? styles.activeModeBtn : styles.modeBtn}>MODO RYDER</button>
               </div>
            </div>
          )}
        </motion.div>
      </div>

      <main style={styles.mainFeed}>
        <AnimatePresence mode="wait">
          {activeMode === 'shopper' && (
            <motion.div key="shopper" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <h3 style={styles.sectionTitle}>TIENDAS CERCANAS (RADAR)</h3>
              <div style={styles.storeGrid}>
                {allStores.map(store => (
                  <div key={store.id} style={styles.storeCard} onClick={() => setCart([...cart, store])}>
                    <img src={store.imagen} style={styles.storeImg} />
                    <h4>{store.nombre}</h4>
                    <p style={{color: '#a855f7'}}>{store.precio}</p>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <button onClick={processPurchase} style={styles.payBtn}>PAGAR CON WALLET (${cart.reduce((a,b)=>a+parseFloat(b.precio.replace('$','')),0)})</button>
              )}
            </motion.div>
          )}

          {activeMode === 'shop' && (
            <motion.div key="shop" initial={{opacity:0}} animate={{opacity:1}} style={styles.sellerPanel}>
               <h3 style={styles.sectionTitle}>CENTRO DE OPERACIONES</h3>
               <div style={styles.statsBox}>
                  <div><p>VENTAS</p><h4>$0.00</h4></div>
                  <div><p>ÓRDENES</p><h4>0</h4></div>
               </div>
               <button style={styles.actionBtn}>+ SUBIR PRODUCTO A N.E.O.N.</button>
            </motion.div>
          )}

          {activeMode === 'ryder' && (
            <motion.div key="ryder" initial={{opacity:0}} animate={{opacity:1}} style={styles.ryderRadar}>
               <div style={styles.radarCircle}>
                  <motion.div animate={{scale:[1,1.5,1], opacity:[0.5,0,0.5]}} transition={{repeat:Infinity, duration:2}} style={styles.radarWave} />
                  <p>BUSCANDO PEDIDOS...</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BOTÓN N.E.O.N. */}
      <nav style={styles.bottomNav}>
        <button onClick={() => {}} style={styles.neonVoiceBtn}><div style={styles.neonInner}></div></button>
      </nav>
    </div>
  );
};

// ... (Aquí irían los styles con el CSS robusto que definimos) ...
export default App;
