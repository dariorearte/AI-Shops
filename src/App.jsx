import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false); // FIX: Estado para la tarjeta
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
    setProfile(p);
    setWallet(w);
  };

  const toggleNeon = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Navegador no compatible");
    
    const rec = new SpeechRecognition();
    rec.lang = 'es-AR';
    setIsAiActive(true);
    rec.start();

    rec.onresult = (e) => {
      const cmd = e.results[0][0].transcript.toLowerCase();
      setTranscript(cmd);
      // Lógica de respuesta inteligente
      if (cmd.includes('saldo') || cmd.includes('dinero')) {
        speak(`Señor, su saldo es de ${wallet?.saldo_disponible || 0} créditos.`);
      } else {
        speak("Entendido. Procesando comando.");
      }
    };

    rec.onend = () => setTimeout(() => { setIsAiActive(false); setTranscript(""); }, 2000);
  };

  const speak = (t) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'es-AR'; u.pitch = 0.85;
    window.speechSynthesis.speak(u);
  };

  if (!session) return <div style={styles.loginPage}><button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} style={styles.mainBtn}>INICIAR N.E.O.N.</button></div>;

  return (
    <div style={styles.container}>
      {/* NEON ID CARD INTERACTIVA */}
      <div style={styles.cardContainer}>
        <motion.div 
          onClick={() => setIsFlipped(!isFlipped)}
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          style={styles.idCard}
        >
          {!isFlipped ? (
            <div style={styles.cardFront}>
              <span style={styles.rangoTag}>{profile?.rango || 'Bronce'}</span>
              <h2 style={{margin: 0, fontSize: '20px'}}>{profile?.nombre || 'Usuario'}</h2>
              <p style={{opacity: 0.5, fontSize: '12px'}}>ID: {session.user.id.substring(0,8)}</p>
            </div>
          ) : (
            <div style={styles.cardBack}>
              <h3 style={{color: '#a855f7', fontSize: '14px', marginBottom: '10px'}}>N.E.O.N. WALLET</h3>
              <p style={{fontSize: '28px', fontWeight: 'bold'}}>${wallet?.saldo_disponible || '0.00'}</p>
              <div style={styles.walletDivider} />
              <p style={{fontSize: '10px', opacity: 0.5}}>Saldo Retenido: ${wallet?.saldo_retenido || '0.00'}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* BOTÓN N.E.O.N. CENTRAL */}
      <div style={styles.nav}>
        <button onClick={toggleNeon} style={styles.neonBtn}>
          <motion.div animate={isAiActive ? { scale: [1, 1.4, 1], boxShadow: '0 0 40px #a855f7' } : {}} style={styles.neonCore} />
        </button>
      </div>

      <AnimatePresence>
        {isAiActive && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={styles.overlay}>
             <p style={styles.aiText}>{transcript || "N.E.O.N. ESCUCHANDO..."}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' },
  mainBtn: { background: 'none', border: '1px solid #a855f7', color: '#fff', padding: '15px 30px', borderRadius: '30px', cursor: 'pointer' },
  cardContainer: { perspective: '1000px', padding: '20px' },
  idCard: { width: '100%', height: '200px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)', borderRadius: '25px', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '25px', cursor: 'pointer', transformStyle: 'preserve-3d' },
  cardFront: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  cardBack: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transform: 'rotateY(180deg)' },
  rangoTag: { position: 'absolute', top: '20px', right: '20px', background: '#a855f7', padding: '4px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' },
  walletDivider: { width: '40px', height: '2px', background: '#a855f7', margin: '15px 0' },
  nav: { position: 'fixed', bottom: '30px', width: '100%', display: 'flex', justifyContent: 'center' },
  neonBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  neonCore: { width: '60px', height: '60px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7 0%, #6366f1 100%)', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  aiText: { color: '#a855f7', fontSize: '24px', letterSpacing: '2px', textAlign: 'center', padding: '0 20px' }
};

export default App;
