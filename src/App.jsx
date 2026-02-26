import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURACIÓN DE NÚCLEO ---
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAiActive, setIsAiActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchProducts();
    // Saludo inicial de Jarvis
    setTimeout(() => speak("Sistema AI Shops en línea. Bienvenido, señor."), 1000);
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('tiendas').select('*');
      if (error) throw error;
      
      const formatted = data.map(item => ({
        id: item.id,
        name: item.nombre,
        price: item.precio,
        category: item.categoria,
        // Limpieza profunda de URL para asegurar que cargue
        image_url: item.imagen ? item.imagen.trim() : "https://images.unsplash.com"
      }));
      setProducts(formatted);
    } catch (err) {
      console.error("Fallo de red:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = 0.8;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceIA = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    
    if (!isAiActive) {
      setIsAiActive(true);
      recognition.start();
            recognition.onresult = (event) => {
        // Acceso correcto al texto capturado por el micrófono
        const text = event.results[0][0].transcript; 
        setTranscript(text);
        console.log("🎙️ Jarvis escuchó:", text);
        
        // Verificamos que el texto exista antes de procesarlo
        if (text) {
          processAICommand(text.toLowerCase());
        }
      };

      recognition.onend = () => setTimeout(() => setIsAiActive(false), 2500);
    }
  };

  const processAICommand = (command) => {
    if (command.includes("café") || command.includes("coffee")) {
      speak("Abriendo Cyber Coffee para usted.");
    } else if (command.includes("hamburguesa") || command.includes("burger")) {
      speak("Neon Burger tiene las mejores recomendaciones hoy.");
    } else {
      speak("He escuchado: " + command + ". ¿Desea que busque algo específico?");
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER DE LUJO */}
      <header style={styles.header}>
        <motion.h1 initial={{y:-20}} animate={{y:0}} style={styles.logo}>
          AI <span style={{color: '#a855f7'}}>SHOPS</span>
        </motion.h1>
      </header>

      {/* GRID DE PRODUCTOS PROFESIONAL */}
      <main style={styles.feed}>
        <div style={styles.grid}>
          {products.map((p, index) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={styles.card}
            >
              <div style={styles.imageContainer}>
                <img 
                  src={p.image_url} 
                  style={styles.image} 
                  alt={p.name}
                  onError={(e) => { e.target.src = "https://images.unsplash.com"; }}
                />
              </div>
              <div style={styles.cardContent}>
                <span style={styles.category}>{p.category}</span>
                <h3 style={styles.productName}>{p.name}</h3>
                <div style={styles.cardFooter}>
                  <span style={styles.price}>{p.price}</span>
                  <button style={styles.addBtn}>+</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* OVERLAY SIRI FUTURISTA */}
      <AnimatePresence>
        {isAiActive && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={styles.siriOverlay}>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={styles.siriCircle} 
            />
            <p style={styles.transcript}>{transcript || "Escuchando..."}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAV BAR ESTILO IPHONE */}
      <nav style={styles.nav}>
        <button style={styles.navIcon}>🏠</button>
        <button onClick={toggleVoiceIA} style={styles.aiButton}>
          <div style={styles.aiInnerCircle}></div>
        </button>
        <button style={styles.navIcon}>🛒</button>
      </nav>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif" },
  header: { padding: '30px 20px', textAlign: 'center', background: 'linear-gradient(to bottom, #111, transparent)' },
  logo: { fontSize: '26px', fontWeight: '900', letterSpacing: '5px' },
  feed: { padding: '0 20px 100px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { backgroundColor: '#0a0a0a', borderRadius: '28px', overflow: 'hidden', border: '1px solid #1a1a1a' },
  imageContainer: { width: '100%', aspectRatio: '1/1', backgroundColor: '#111' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  cardContent: { padding: '15px' },
  category: { fontSize: '10px', color: '#a855f7', textTransform: 'uppercase', fontWeight: 'bold' },
  productName: { fontSize: '16px', margin: '5px 0', fontWeight: '600' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
  price: { fontSize: '18px', fontWeight: '800', color: '#fff' },
  addBtn: { background: '#a855f7', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '10px', cursor: 'pointer' },
  nav: { position: 'fixed', bottom: '20px', left: '5%', width: '90%', height: '70px', backgroundColor: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(15px)', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid #333' },
  aiButton: { width: '55px', height: '55px', borderRadius: '50%', background: 'linear-gradient(45deg, #a855f7, #6366f1)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(168,85,247,0.4)' },
  aiInnerCircle: { width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #fff' },
  navIcon: { background: 'none', border: 'none', fontSize: '22px', opacity: 0.6 },
  siriOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  siriCircle: { width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', boxShadow: '0 0 60px #a855f7' },
  transcript: { marginTop: '40px', fontSize: '22px', color: '#a855f7', fontWeight: '300' }
};

export default App;
