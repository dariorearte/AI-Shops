import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Truck, ShoppingBag, Plus, CreditCard, Map, User } from 'lucide-react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [activeMode, setActiveMode] = useState('shopper');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCoreData(session.user.id);
    });
    fetchInitialProducts();
  }, []);

  const fetchCoreData = async (userId) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', userId).single();
    const { data: w } = await supabase.from('wallets').select('*').eq('id', userId).single();
    if (p) { setProfile(p); setActiveMode(p.rol || 'shopper'); }
    if (w) setWallet(w);
  };

  const fetchInitialProducts = async () => {
    const { data } = await supabase.from('productos').select('*');
    setProducts(data || []);
  };

  // --- FASE A: MODO SHOP (STORAGE REAL) ---
  const handleAddProduct = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const nombre = prompt("Nombre del Producto:");
    const precio = prompt("Precio:");
    if (!nombre || !precio) return;

    setUploading(true);
    const fileName = `${Math.random()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage.from('productos-fotos').upload(fileName, file);
    if (uploadError) return alert("Error al subir imagen");

    const { data: urlData } = supabase.storage.from('productos-fotos').getPublicUrl(fileName);

    const { error: dbError } = await supabase.from('productos').insert([{
      shop_id: session.user.id,
      nombre,
      precio: parseFloat(precio),
      imagen_url: urlData.publicUrl
    }]);

    if (!dbError) {
      fetchInitialProducts();
      alert("Producto cargado en N.E.O.N.");
    }
    setUploading(false);
  };

  // --- FASE C: MODO SHOPPER (ESCROW & WALLET) ---
  const handlePurchase = async () => {
    const total = cart.reduce((acc, p) => acc + p.precio, 0);
    if (wallet.saldo_disponible < total) return alert("Saldo insuficiente");

    const { error } = await supabase.from('pedidos').insert([{
      shopper_id: session.user.id,
      items: cart,
      total: total,
      estado: 'pendiente'
    }]);

    if (!error) {
      await supabase.from('wallets').update({
        saldo_disponible: wallet.saldo_disponible - total,
        saldo_retenido: wallet.saldo_retenido + total
      }).eq('id', session.user.id);
      
      setCart([]);
      alert("Pago retenido en Escrow. N.E.O.N. buscando Ryder.");
    }
  };

  const switchMode = async (mode) => {
    await supabase.from('perfiles').update({ rol: mode }).eq('id', session.user.id);
    setActiveMode(mode);
    setIsFlipped(false);
  };

  if (!session) return <div style={styles.loginPage}><button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} style={styles.mainBtn}>INICIAR N.E.O.N.</button></div>;

  return (
    <div style={styles.container}>
      <div style={styles.cardContainer}>
        <motion.div onClick={() => setIsFlipped(!isFlipped)} animate={{ rotateY: isFlipped ? 180 : 0 }} style={styles.idCard}>
          {!isFlipped ? (
            <div style={styles.cardFront}>
              <span style={styles.rangoBadge}>{profile?.rango || 'BRONCE'}</span>
              <h2 style={{margin: 0}}>{profile?.nombre || 'Usuario'}</h2>
              <p style={{color: '#a855f7'}}>WALLET: ${wallet?.saldo_disponible || '0.00'}</p>
            </div>
          ) : (
            <div style={styles.cardBack}>
              <div style={styles.modeGrid}>
                <button onClick={(e) => { e.stopPropagation(); switchMode('shopper'); }} style={activeMode === 'shopper' ? styles.activeBtn : styles.btn}><ShoppingBag size={14}/> COMPRAR</button>
                <button onClick={(e) => { e.stopPropagation(); switchMode('shop'); }} style={activeMode === 'shop' ? styles.activeBtn : styles.btn}><Store size={14}/> VENDER</button>
                <button onClick={(e) => { e.stopPropagation(); switchMode('ryder'); }} style={activeMode === 'ryder' ? styles.activeBtn : styles.btn}><Truck size={14}/> ENVIAR</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <main style={{padding: '0 20px 100px'}}>
        {activeMode === 'shop' && (
          <div style={styles.view}>
            <h3 style={styles.title}>CENTRO DE CONTROL VENDEDOR</h3>
            <label style={styles.actionBtn}>
              <Plus size={20}/> {uploading ? 'SUBIENDO...' : 'NUEVO PRODUCTO'}
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleAddProduct} />
            </label>
          </div>
        )}

        {activeMode === 'ryder' && (
          <div style={styles.view}>
            <h3 style={styles.title}>RADAR TÁCTICO RYDER</h3>
            <div style={styles.radar}><motion.div animate={{scale:[1,1.5,1], opacity:[0.5,0,0.5]}} transition={{repeat:Infinity, duration:2}} style={styles.pulse}/></div>
          </div>
        )}

        {activeMode === 'shopper' && (
          <div style={styles.grid}>
            {products.map(p => (
              <div key={p.id} style={styles.card} onClick={() => setCart([...cart, p])}>
                <img src={p.imagen_url} style={styles.img} />
                <p>{p.nombre}</p>
                <b style={{color: '#a855f7'}}>${p.precio}</b>
              </div>
            ))}
          </div>
        )}
      </main>

      {cart.length > 0 && activeMode === 'shopper' && (
        <button onClick={handlePurchase} style={styles.payBtn}>PAGAR CON WALLET ({cart.length})</button>
      )}

      <nav style={styles.nav}><div style={styles.neonBtn}></div></nav>
    </div>
  );
};

const styles = {
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' },
  mainBtn: { background: 'none', border: '1px solid #a855f7', color: '#fff', padding: '15px 30px', borderRadius: '30px' },
  cardContainer: { perspective: '1000px', padding: '20px' },
  idCard: { width: '100%', height: '220px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: '30px', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '25px', transformStyle: 'preserve-3d' },
  cardFront: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  cardBack: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transform: 'rotateY(180deg)' },
  rangoBadge: { position: 'absolute', top: '20px', right: '20px', background: '#a855f7', padding: '5px 12px', borderRadius: '15px', fontSize: '10px' },
  modeGrid: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' },
  btn: { background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px' },
  activeBtn: { background: '#a855f7', border: 'none', color: '#fff', padding: '10px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px' },
  title: { color: '#a855f7', letterSpacing: '3px', fontSize: '14px', marginBottom: '30px', textAlign: 'center' },
  actionBtn: { width: '100%', background: '#a855f7', padding: '15px', borderRadius: '15px', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  radar: { width: '150px', height: '150px', borderRadius: '50%', border: '2px solid #a855f7', margin: '40px auto', position: 'relative' },
  pulse: { position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '1px solid #a855f7' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  card: { background: '#0a0a0a', padding: '10px', borderRadius: '20px', border: '1px solid #111' },
  img: { width: '100%', borderRadius: '15px', aspectRatio: '1/1', objectFit: 'cover' },
  payBtn: { position: 'fixed', bottom: '110px', left: '10%', width: '80%', background: '#a855f7', padding: '18px', borderRadius: '20px', color: '#fff', fontWeight: 'bold', zIndex: 100 },
  nav: { position: 'fixed', bottom: '30px', width: '100%', display: 'flex', justifyContent: 'center' },
  neonBtn: { width: '60px', height: '60px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7 0%, #6366f1 100%)', boxShadow: '0 0 20px #a855f7' }
};

export default App;
