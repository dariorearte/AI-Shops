import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeMode, setActiveMode] = useState('shopper');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCoreData(session.user.id);
    });
    fetchStores();
  }, []);

  const fetchCoreData = async (userId) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', userId).single();
    const { data: w } = await supabase.from('wallets').select('*').eq('id', userId).single();
    if (p) { setProfile(p); setActiveMode(p.rol || 'shopper'); }
    if (w) setWallet(w);
  };

  const fetchStores = async () => {
    const { data } = await supabase.from('tiendas').select('*');
    setProducts(data || []);
  };

  const switchMode = async (newMode) => {
    await supabase.from('perfiles').update({ rol: newMode }).eq('id', session.user.id);
    setActiveMode(newMode);
    setIsFlipped(false);
    const msgs = { shop: "Modo Shop activo. Panel de ventas listo.", ryder: "Modo Ryder activo. Radar de rutas calibrado.", shopper: "Modo Shopper activo. Bienvenido al mercado." };
    speak(msgs[newMode]);
  };

  const speak = (t) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t); u.lang = 'es-AR'; u.pitch = 0.85;
    window.speechSynthesis.speak(u);
  };

  if (!session) return <div style={styles.loginPage}><button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} style={styles.mainBtn}>INICIAR N.E.O.N.</button></div>;

  return (
    <div style={styles.container}>
      {/* C - NEON ID CARD & WALLET */}
      <div style={styles.cardContainer}>
        <motion.div onClick={() => setIsFlipped(!isFlipped)} animate={{ rotateY: isFlipped ? 180 : 0 }} style={styles.idCard}>
          {!isFlipped ? (
            <div style={styles.cardFront}>
              <span style={styles.rangoTag}>{profile?.rango || 'Bronce'}</span>
              <h2 style={{margin: 0}}>{profile?.nombre || 'Usuario'}</h2>
              <p style={{fontSize: '11px', opacity: 0.5}}>{activeMode.toUpperCase()} - WALLET: ${wallet?.saldo_disponible || '0.00'}</p>
            </div>
          ) : (
            <div style={styles.cardBack}>
              <div style={styles.switchGroup}>
                <button onClick={(e) => { e.stopPropagation(); switchMode('shopper'); }} style={activeMode === 'shopper' ? styles.activeBtn : styles.btn}>SHOPPER</button>
                <button onClick={(e) => { e.stopPropagation(); switchMode('shop'); }} style={activeMode === 'shop' ? styles.activeBtn : styles.btn}>MODO SHOP</button>
                <button onClick={(e) => { e.stopPropagation(); switchMode('ryder'); }} style={activeMode === 'ryder' ? styles.activeBtn : styles.btn}>MODO RYDER</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <main style={{padding: '0 20px 100px'}}>
        {/* A - MODO SHOP (Panel de Ventas) */}
        {activeMode === 'shop' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={styles.viewBox}>
            <h2 style={styles.neonText}>CENTRO DE CONTROL VENDEDOR</h2>
            <div style={styles.statsRow}>
              <div style={styles.stat}><h3>$0</h3><p>Ventas Hoy</p></div>
              <div style={styles.stat}><h3>0</h3><p>Visitas</p></div>
            </div>
            <button style={styles.actionBtn}>+ CARGAR PRODUCTO</button>
          </motion.div>
        )}

        {/* B - MODO RYDER (Radar Táctico) */}
        {activeMode === 'ryder' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={styles.viewBox}>
            <h2 style={styles.neonText}>SISTEMA DE RUTAS RYDER</h2>
            <div style={styles.radarCircle}>
               <motion.div animate={{scale:[1,1.5,1], opacity:[1,0,1]}} transition={{repeat:Infinity, duration:2}} style={styles.radarPulse} />
               <p style={{fontSize:'10px', marginTop:'60px'}}>ESCANEANDO PEDIDOS...</p>
            </div>
          </motion.div>
        )}

        {/* C - MODO SHOPPER (Feed) */}
        {activeMode === 'shopper' && (
          <div style={styles.grid}>
            {products.map(p => (
              <div key={p.id} style={styles.card}>
                <img src={p.imagen} style={styles.image} />
                <h3 style={{fontSize:'14px', marginTop:'10px'}}>{p.nombre}</h3>
                <p style={{color:'#a855f7', fontWeight:'bold'}}>{p.precio}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav style={styles.nav}>
        <button onClick={() => setIsAiActive(!isAiActive)} style={styles.neonBtn}><div style={styles.neonCore}></div></button>
      </nav>
    </div>
  );
};

const styles = {
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' },
  mainBtn: { background: 'none', border: '1px solid #a855f7', color: '#fff', padding: '15px 30px', borderRadius: '30px', letterSpacing: '2px' },
  cardContainer: { perspective: '1000px', padding: '20px' },
  idCard: { width: '100%', height: '220px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(25px)', borderRadius: '30px', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '25px', transformStyle: 'preserve-3d' },
  cardFront: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  cardBack: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transform: 'rotateY(180deg)' },
  rangoTag: { position: 'absolute', top: '20px', right: '20px', background: '#a855f7', padding: '5px 15px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold' },
  switchGroup: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' },
  btn: { background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '15px', fontSize: '10px' },
  activeBtn: { background: '#a855f7', border: 'none', color: '#fff', padding: '10px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold' },
  viewBox: { textAlign: 'center', paddingTop: '20px' },
  neonText: { color: '#a855f7', letterSpacing: '3px', fontSize: '14px', marginBottom: '30px' },
  statsRow: { display: 'flex', justifyContent: 'space-around', marginBottom: '30px' },
  stat: { background: '#0a0a0a', padding: '15px', borderRadius: '20px', width: '40%', border: '1px solid #222' },
  actionBtn: { width: '100%', background: '#a855f7', padding: '15px', border: 'none', borderRadius: '15px', color: '#fff', fontWeight: 'bold' },
  radarCircle: { width: '150px', height: '150px', borderRadius: '50%', border: '2px solid #a855f7', margin: '40px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  radarPulse: { position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '1px solid #a855f7' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  card: { background: '#0a0a0a', padding: '10px', borderRadius: '20px', border: '1px solid #111' },
  image: { width: '100%', borderRadius: '15px', aspectRatio: '1/1', objectFit: 'cover' },
  nav: { position: 'fixed', bottom: '30px', width: '100%', display: 'flex', justifyContent: 'center' },
  neonBtn: { background: 'none', border: 'none' },
  neonCore: { width: '60px', height: '60px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7 0%, #6366f1 100%)', boxShadow: '0 0 20px #a855f7' }
};

export default App;
