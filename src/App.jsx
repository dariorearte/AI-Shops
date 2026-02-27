import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeMode, setActiveMode] = useState('shopper');
  const [isAiActive, setIsAiActive] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCoreData(session.user.id);
    });
  }, []);

  const fetchCoreData = async (userId) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', userId).single();
    const { data: w } = await supabase.from('wallets').select('*').eq('id', userId).single();
    if (p) { setProfile(p); setActiveMode(p.rol || 'shopper'); }
    if (w) setWallet(w);
  };

  const switchMode = async (newMode) => {
    const { error } = await supabase.from('perfiles').update({ rol: newMode }).eq('id', session.user.id);
    if (!error) {
      setActiveMode(newMode);
      setIsFlipped(false);
      speak(`Sistema configurado en Modo ${newMode === 'shop' ? 'Tienda' : newMode === 'ryder' ? 'Ryder' : 'Comprador'}`);
    }
  };

  const speak = (t) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'es-AR'; u.pitch = 0.85;
    window.speechSynthesis.speak(u);
  };

  if (!session) return <div style={styles.loginPage}><button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} style={styles.mainBtn}>INICIAR N.E.O.N.</button></div>;

  return (
    <div style={styles.container}>
      <div style={styles.cardContainer}>
        <motion.div 
          onClick={() => setIsFlipped(!isFlipped)}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          style={styles.idCard}
        >
          {!isFlipped ? (
            <div style={styles.cardFront}>
              <span style={styles.rangoTag}>{profile?.rango || 'Bronce'}</span>
              <h2 style={{margin: 0, fontSize: '20px'}}>{profile?.nombre || 'Usuario'}</h2>
              <p style={{opacity: 0.5, fontSize: '11px', letterSpacing: '2px'}}>{activeMode.toUpperCase()}</p>
            </div>
          ) : (
            <div style={styles.cardBack}>
              <p style={{fontSize: '10px', marginBottom: '15px', opacity: 0.6}}>CAMBIAR MODO DE CONCIENCIA</p>
              <div style={styles.switchGroup}>
                <button onClick={(e) => { e.stopPropagation(); switchMode('shopper'); }} style={activeMode === 'shopper' ? styles.activeBtn : styles.btn}>SHOPPER</button>
                <button onClick={(e) => { e.stopPropagation(); switchMode('shop'); }} style={activeMode === 'shop' ? styles.activeBtn : styles.btn}>MODO SHOP</button>
                <button onClick={(e) => { e.stopPropagation(); switchMode('ryder'); }} style={activeMode === 'ryder' ? styles.activeBtn : styles.btn}>MODO RYDER</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <main style={{padding: '20px', textAlign: 'center'}}>
        <h2 style={styles.neonText}>
          {activeMode === 'shopper' && "RADAR TÁCTICO DE TIENDAS"}
          {activeMode === 'shop' && "CENTRO DE CONTROL VENDEDOR"}
          {activeMode === 'ryder' && "SISTEMA DE RUTAS RYDER"}
        </h2>
      </main>

      <nav style={styles.nav}>
        <button onClick={() => {}} style={styles.neonBtn}><div style={styles.neonCore}></div></button>
      </nav>
    </div>
  );
};

const styles = {
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' },
  mainBtn: { background: 'none', border: '1px solid #a855f7', color: '#fff', padding: '15px 30px', borderRadius: '30px', cursor: 'pointer', letterSpacing: '2px' },
  cardContainer: { perspective: '1000px', padding: '20px' },
  idCard: { width: '100%', height: '220px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: '30px', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '25px', cursor: 'pointer', transformStyle: 'preserve-3d' },
  cardFront: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  cardBack: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transform: 'rotateY(180deg)' },
  rangoTag: { position: 'absolute', top: '20px', right: '20px', background: '#a855f7', padding: '5px 15px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold' },
  switchGroup: { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' },
  btn: { background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '12px', fontSize: '11px', letterSpacing: '1px' },
  activeBtn: { background: '#a855f7', border: 'none', color: '#fff', padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 0 15px #a855f7' },
  neonText: { color: '#a855f7', letterSpacing: '5px', fontSize: '16px', textShadow: '0 0 10px #a855f7', marginTop: '40px' },
  nav: { position: 'fixed', bottom: '30px', width: '100%', display: 'flex', justifyContent: 'center' },
  neonBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  neonCore: { width: '65px', height: '65px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7 0%, #6366f1 100%)', boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)' }
};

export default App;
