import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [activeMode, setActiveMode] = useState('shopper'); // El Camaleón
  const [isAiActive, setIsAiActive] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCoreData(session.user.id);
    });
  }, []);

  const fetchCoreData = async (userId) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', userId).single();
    const { data: w } = await supabase.from('wallets').select('*').eq('id', userId).single();
    setProfile(p);
    setWallet(w);
    if (p?.rol) setActiveMode(p.rol);
  };

  const toggleNeon = () => {
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = 'es-AR';
    setIsAiActive(true);
    rec.start();
    rec.onresult = (e) => {
      const cmd = e.results[0][0].transcript.toLowerCase();
      if (cmd.includes('billetera') || cmd.includes('wallet')) speak(`Señor, su saldo disponible es de ${wallet?.saldo_disponible || 0} créditos.`);
    };
    rec.onend = () => setIsAiActive(false);
  };

  const speak = (t) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'es-AR'; u.pitch = 0.8;
    window.speechSynthesis.speak(u);
  };

  if (!session) return (
    <div style={styles.loginPage}>
      <motion.h1 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 3 }} style={styles.neonTitle}>N.E.O.N.</motion.h1>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} style={styles.mainBtn}>INICIAR SISTEMA</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* NEON ID CARD / WALLET (GIRATORIA) */}
      <motion.div whileTap={{ rotateY: 180 }} style={styles.idCard}>
        <div style={styles.cardFront}>
          <span style={styles.rangoTag}>{profile?.rango || 'Bronce'}</span>
          <h2 style={{margin: 0}}>{profile?.nombre || 'Usuario N.E.O.N.'}</h2>
          <p style={{opacity: 0.6}}>ID: {session.user.id.substring(0,8)}</p>
        </div>
      </motion.div>

      {/* RENDERIZADO POR ROL (MODO CAMALEÓN) */}
      <main style={styles.mainContent}>
        {activeMode === 'shopper' && <h2 style={styles.modeTitle}>Radar de Tiendas</h2>}
        {activeMode === 'seller' && <h2 style={styles.modeTitle}>Panel de Control Seller</h2>}
        {activeMode === 'driver' && <h2 style={styles.modeTitle}>Rutas de Entrega</h2>}
      </main>

      {/* EL LOGO N.E.O.N. (BOTÓN DE IA) */}
      <div style={styles.nav}>
        <button style={styles.navIcon}>🏠</button>
        <button onClick={toggleNeon} style={styles.neonBtn}>
          <motion.div animate={isAiActive ? { scale: [1, 1.5, 1] } : {}} style={styles.neonCore} />
        </button>
        <button style={styles.navIcon}>🛒</button>
      </div>

      <AnimatePresence>
        {isAiActive && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={styles.overlay}>
             <p style={styles.aiText}>N.E.O.N. ESCUCHANDO...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
  loginPage: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#000' },
  neonTitle: { fontSize: '60px', letterSpacing: '15px', color: '#a855f7', textShadow: '0 0 20px #a855f7' },
  mainBtn: { background: 'none', border: '1px solid #a855f7', color: '#fff', padding: '15px 40px', borderRadius: '30px', cursor: 'pointer', letterSpacing: '2px' },
  idCard: { width: '90%', height: '200px', margin: '20px auto', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: '25px', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '25px', position: 'relative', transformStyle: 'preserve-3d' },
  rangoTag: { position: 'absolute', top: '20px', right: '20px', background: '#a855f7', padding: '5px 15px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  mainContent: { padding: '20px', textAlign: 'center' },
  modeTitle: { fontSize: '20px', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '3px' },
  nav: { position: 'fixed', bottom: '30px', width: '90%', left: '5%', height: '70px', background: 'rgba(15,15,15,0.9)', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid #333' },
  neonBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  neonCore: { width: '50px', height: '50px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7 0%, #6366f1 100%)', boxShadow: '0 0 20px #a855f7' },
  navIcon: { background: 'none', border: 'none', color: '#fff', fontSize: '24px', opacity: 0.5 },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  aiText: { color: '#a855f7', fontSize: '22px', letterSpacing: '4px' }
};

export default App;
