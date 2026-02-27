import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- NÚCLEO N.E.O.N. ---
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const App = () => {
  const [view, setView] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [isAiActive, setIsAiActive] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    fetchProducts();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('tiendas').select('*');
    setProducts(data || []);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  // --- LÓGICA DE VOZ AVANZADA (SIRI STYLE) ---
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    
    setIsAiActive(true);
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processCommand(text.toLowerCase());
    };

    recognition.onend = () => {
      setTimeout(() => {
        setIsAiActive(false);
        setTranscript("");
      }, 2000);
    };
  };

  const processCommand = (cmd) => {
    if (cmd.includes("carrito")) setView('cart');
    if (cmd.includes("inicio") || cmd.includes("tienda")) setView('home');
  };

  return (
    <div style={styles.container}>
      {/* HEADER PREMIUM */}
      <header style={styles.header}>
        <h1 style={styles.logo}>AI <span style={{color: '#a855f7'}}>SHOPS</span></h1>
        {user ? (
          <img src={user.user_metadata.avatar_url} style={styles.avatar} alt="Profile" />
        ) : (
          <button onClick={handleLogin} style={styles.loginBtn}>CONECTAR</button>
        )}
      </header>

      {/* VISTAS DINÁMICAS */}
      <main style={styles.main}>
        {view === 'home' ? (
          <div style={styles.grid}>
            {products.map(p => (
              <motion.div whileHover={{ scale: 1.02 }} key={p.id} style={styles.card}>
                <div style={styles.imgWrapper}>
                   <img src={p.imagen || "https://images.unsplash.com"} style={styles.image} />
                </div>
                <h3 style={styles.pName}>{p.nombre}</h3>
                <div style={styles.pFooter}>
                  <span style={styles.pPrice}>{p.precio}</span>
                  <button onClick={() => setCart([...cart, p])} style={styles.addBtn}>+</button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={styles.cartView}>
            <h2 style={{fontSize: '24px', marginBottom: '20px'}}>Tu Selección</h2>
            {cart.map((item, i) => (
              <div key={i} style={styles.cartItem}>{item.nombre} <span style={{color: '#a855f7'}}>{item.precio}</span></div>
            ))}
            <button style={styles.checkoutBtn}>PAGAR AHORA</button>
          </div>
        )}
      </main>

      {/* INTERFAZ N.E.O.N. (Ondas de luz) */}
      <AnimatePresence>
        {isAiActive && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={styles.overlay}>
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={styles.neonPulse} 
            />
            <p style={styles.transcript}>{transcript || "N.E.O.N. Escuchando..."}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAV BAR FLOTANTE ESTILO IPHONE */}
      <nav style={styles.nav}>
        <button onClick={() => setView('home')} style={styles.navIcon}>🏠</button>
        <button onClick={toggleVoice} style={styles.aiBtn}>
          <div style={styles.aiInner}></div>
        </button>
        <button onClick={() => setView('cart')} style={styles.navIcon}>🛒 ({cart.length})</button>
      </nav>
    </div>
  );
};

const styles = {
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
  header: { padding: '30px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '24px', letterSpacing: '4px', fontWeight: '900' },
  loginBtn: { background: 'none', border: '1px solid #a855f7', color: '#a855f7', padding: '8px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  avatar: { width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #a855f7' },
  main: { padding: '0 20px 100px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { background: '#0a0a0a', borderRadius: '24px', border: '1px solid #1a1a1a', overflow: 'hidden' },
  imgWrapper: { width: '100%', aspectRatio: '1/1', background: '#111' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  pName: { fontSize: '15px', padding: '10px 15px 5px', fontWeight: '600' },
  pFooter: { padding: '0 15px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pPrice: { color: '#a855f7', fontWeight: '800' },
  addBtn: { background: '#a855f7', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '10px', fontWeight: 'bold' },
  nav: { position: 'fixed', bottom: '20px', left: '10%', width: '80%', height: '70px', background: 'rgba(15,15,15,0.8)', backdropFilter: 'blur(15px)', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid #333' },
  aiBtn: { width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(45deg, #a855f7, #6366f1)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(168,85,247,0.5)', position: 'relative', top: '-20px' },
  aiInner: { width: '25px', height: '25px', borderRadius: '50%', border: '2px solid #fff' },
  navIcon: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', opacity: 0.6 },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  neonPulse: { width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', boxShadow: '0 0 60px #a855f7' },
  transcript: { marginTop: '40px', color: '#a855f7', fontSize: '22px', fontWeight: '300' },
  cartView: { padding: '20px' },
  cartItem: { padding: '15px', background: '#0a0a0a', borderRadius: '15px', marginBottom: '10px', border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between' },
  checkoutBtn: { width: '100%', padding: '18px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '900', marginTop: '20px', letterSpacing: '2px' }
};

export default App;
