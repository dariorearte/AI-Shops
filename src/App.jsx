import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURACIÓN N.E.O.N. ---
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const App = () => {
  const [view, setView] = useState('home'); // 'home', 'cart', 'orders'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [isAiActive, setIsAiActive] = useState(false);

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

  // --- LÓGICA DE NEGOCIO ---
  const addToCart = (p) => {
    setCart([...cart, p]);
    speak(`Añadido ${p.nombre} al carrito.`);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const speak = (t) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'es-ES';
    u.pitch = 0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 onClick={() => setView('home')} style={styles.logo}>AI <span style={{color:'#a855f7'}}>SHOPS</span></h1>
        {!user && <button onClick={handleLogin} style={styles.loginBtn}>Login</button>}
      </header>

      <main style={styles.main}>
        {view === 'home' ? (
          <div style={styles.grid}>
            {products.map(p => (
              <div key={p.id} style={styles.card}>
                <img src={p.imagen || "https://images.unsplash.com"} style={styles.image} />
                <h3>{p.nombre}</h3>
                <button onClick={() => addToCart(p)} style={styles.addBtn}>Añadir {p.precio}</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.cartView}>
            <h2>Tu Carrito ({cart.length})</h2>
            {cart.map((item, i) => <div key={i} style={styles.cartItem}>{item.nombre} - {item.precio}</div>)}
            <button style={styles.checkoutBtn}>Finalizar Compra</button>
          </div>
        )}
      </main>

      {/* BOTÓN N.E.O.N. */}
      <button onClick={() => setIsAiActive(!isAiActive)} style={styles.aiButton}>🎙️</button>

      <nav style={styles.nav}>
        <button onClick={() => setView('home')}>🏠</button>
        <button onClick={() => setView('cart')}>🛒 ({cart.length})</button>
      </nav>
    </div>
  );
};

const styles = {
  container: { background: '#050505', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
  header: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '22px', letterSpacing: '3px', cursor: 'pointer' },
  loginBtn: { background: '#a855f7', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '15px' },
  card: { background: '#111', borderRadius: '20px', padding: '10px', border: '1px solid #222' },
  image: { width: '100%', borderRadius: '15px', aspectRatio: '1/1', objectFit: 'cover' },
  addBtn: { width: '100%', marginTop: '10px', background: '#a855f7', border: 'none', color: '#fff', padding: '8px', borderRadius: '10px' },
  nav: { position: 'fixed', bottom: 0, width: '100%', height: '70px', background: '#000', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #222' },
  aiButton: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(45deg, #a855f7, #6366f1)', border: 'none', zIndex: 100 },
  cartView: { padding: '20px' },
  checkoutBtn: { width: '100%', padding: '15px', background: '#a855f7', border: 'none', color: '#fff', borderRadius: '15px', marginTop: '20px' }
};

export default App;
