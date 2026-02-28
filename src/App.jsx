import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Truck, ShoppingBag, Plus, CreditCard, Mic, Map } from 'lucide-react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  // --- ESTADOS N.E.O.N. ---
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [activeMode, setActiveMode] = useState('shopper');
  const [products, setProducts] = useState([]);
  const [isAiActive, setIsAiActive] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [view, setView] = useState('home');

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

  // --- MOTOR DE VOZ (RESTAURADO E INFALIBLE) ---
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'es-AR';
    setIsAiActive(true);
    rec.start();
    rec.onresult = (e) => {
      const cmd = e.results[0][0].transcript.toLowerCase();
      if (cmd.includes('tienda') || cmd.includes('vender')) switchMode('shop');
      if (cmd.includes('comprar')) switchMode('shopper');
      if (cmd.includes('envío') || cmd.includes('ryder')) switchMode('ryder');
      speak(`Entendido. Configurando ${cmd}`);
    };
    rec.onend = () => setIsAiActive(false);
  };

  const speak = (t) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t); u.lang = 'es-AR'; u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  };

  // --- ACCIONES DE NEGOCIO ---
  const switchMode = async (mode) => {
    await supabase.from('perfiles').update({ rol: mode }).eq('id', session.user.id);
    setActiveMode(mode);
    setIsFlipped(false);
    speak(`Modo ${mode} activado.`);
  };

    // --- NUEVA LÓGICA DE STORAGE ---
  const handleAddProduct = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0]; // Capturamos el archivo real
      const nombre = prompt("Nombre del producto:");
      const precio = prompt("Precio:");
      
      if (!file || !nombre || !precio) return speak("Carga cancelada, faltan datos.");

      speak("Subiendo producto a la red neuronal...");
      
      // 1. Subir al Storage de Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('productos-fotos')
        .upload(filePath, file);

      if (uploadError) return console.error("Error de subida:", uploadError);

      // 2. Obtener la URL Pública
      const { data: urlData } = supabase.storage.from('productos-fotos').getPublicUrl(filePath);

      // 3. Guardar en la Base de Datos con la URL Real
      const { error: dbError } = await supabase.from('productos').insert([{
        shop_id: session.user.id,
        nombre,
        precio: parseFloat(precio),
        imagen_url: urlData.publicUrl
      }]);

      if (!dbError) {
        speak("Producto en línea. Excelente elección, señor.");
        fetchInitialProducts(); // Refrescar el feed
      } else {
        console.error("Error DB:", dbError);
      }
    };
    
    fileInput.click(); // Abrir el selector de archivos del celular/PC
  };


  if (!session) return (
    <div style={styles.loginPage}>
      <motion.h1 animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 3 }} style={styles.neonTitle}>N.E.O.N.</motion.h1>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} style={styles.mainBtn}>INICIAR SISTEMA</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* 💳 NEON ID CARD - VINCULADA A WALLET */}
      <div style={styles.cardContainer}>
        <motion.div onClick={() => setIsFlipped(!isFlipped)} animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6 }} style={styles.idCard}>
          {!isFlipped ? (
            <div style={styles.cardFront}>
              <div style={styles.rangoBadge}>{profile?.rango || 'BRONCE'}</div>
              <h2 style={{margin: 0, fontSize: '22px'}}>{profile?.nombre || 'USER'}</h2>
              <p style={styles.cardWallet}>WALLET: ${wallet?.saldo_disponible || '0.00'}</p>
            </div>
          ) : (
            <div style={styles.cardBack}>
              <div style={styles.modeGrid}>
                <button onClick={(e) => { e.stopPropagation(); switchMode('shopper'); }} style={activeMode === 'shopper' ? styles.activeModeBtn : styles.modeBtn}><ShoppingBag size={16} /> SHOPPER</button>
                <button onClick={(e) => { e.stopPropagation(); switchMode('shop'); }} style={activeMode === 'shop' ? styles.activeModeBtn : styles.modeBtn}><Store size={16} /> MODO SHOP</button>
                <button onClick={(e) => { e.stopPropagation(); switchMode('ryder'); }} style={activeMode === 'ryder' ? styles.activeModeBtn : styles.modeBtn}><Truck size={16} /> MODO RYDER</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 🖥️ VISTAS SEGÚN MODO */}
      <main style={{padding: '0 20px 100px'}}>
        {activeMode === 'shop' && (
          <div style={styles.viewBox}>
            <h2 style={styles.sectionTitle}>CENTRO DE CONTROL VENDEDOR</h2>
            <div style={styles.statsRow}>
              <div style={styles.stat}><h3>$0</h3><p>Ventas</p></div>
              <div style={styles.stat}><h3>0</h3><p>Visitas</p></div>
            </div>
            <button onClick={handleAddProduct} style={styles.actionBtn}><Plus size={20} /> NUEVO PRODUCTO</button>
          </div>
        )}

        {activeMode === 'ryder' && (
          <div style={styles.viewBox}>
            <h2 style={styles.sectionTitle}>RADAR TÁCTICO RYDER</h2>
            <div style={styles.radarCircle}>
               <motion.div animate={{scale:[1, 1.5, 1], opacity:[0.5, 0, 0.5]}} transition={{repeat:Infinity, duration:2}} style={styles.radarPulse} />
               <Map size={40} color="#a855f7" />
            </div>
            <p style={{fontSize: '12px', marginTop: '20px'}}>ESCANEANDO PEDIDOS CERCANOS...</p>
          </div>
        )}

        {activeMode === 'shopper' && (
          <div style={styles.grid}>
            {products.map(p => (
              <div key={p.id} style={styles.card}>
                <img src={p.imagen_url || "https://images.unsplash.com"} style={styles.image} />
                <h3 style={{fontSize: '14px', marginTop: '10px'}}>{p.nombre}</h3>
                <p style={{color: '#a855f7', fontWeight: 'bold'}}>${p.precio}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 🎙️ BOTÓN N.E.O.N. CENTRAL */}
      <nav style={styles.nav}>
        <button onClick={toggleVoice} style={styles.neonBtn}>
          <div style={isAiActive ? styles.neonCoreActive : styles.neonCore}></div>
        </button>
      </nav>

      {/* OVERLAY DE VOZ */}
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
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
  loginPage: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  neonTitle: { fontSize: '60px', letterSpacing: '10px', color: '#a855f7', textShadow: '0 0 20px #a855f7' },
  mainBtn: { background: 'none', border: '1px solid #a855f7', color: '#fff', padding: '15px 40px', borderRadius: '30px', cursor: 'pointer' },
  cardContainer: { perspective: '1000px', padding: '20px' },
  idCard: { width: '100%', height: '220px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: '30px', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '25px', transformStyle: 'preserve-3d', cursor: 'pointer' },
  cardFront: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  cardBack: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transform: 'rotateY(180deg)' },
  rangoBadge: { position: 'absolute', top: '20px', right: '20px', background: '#a855f7', padding: '5px 15px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold' },
  cardWallet: { color: '#a855f7', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' },
  modeGrid: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' },
  modeBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '15px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  activeModeBtn: { background: '#a855f7', border: 'none', color: '#fff', padding: '12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 15px #a855f7', cursor: 'pointer' },
  viewBox: { textAlign: 'center', paddingTop: '20px' },
  sectionTitle: { color: '#a855f7', letterSpacing: '3px', fontSize: '14px', marginBottom: '30px' },
  statsRow: { display: 'flex', justifyContent: 'space-around', marginBottom: '30px' },
  stat: { background: '#0a0a0a', padding: '15px', borderRadius: '20px', width: '40%', border: '1px solid #222' },
  actionBtn: { width: '100%', background: '#a855f7', padding: '15px', border: 'none', borderRadius: '15px', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  radarCircle: { width: '150px', height: '150px', borderRadius: '50%', border: '2px solid #a855f7', margin: '40px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  radarPulse: { position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '1px solid #a855f7' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  card: { background: '#0a0a0a', padding: '10px', borderRadius: '20px', border: '1px solid #111' },
  image: { width: '100%', borderRadius: '15px', aspectRatio: '1/1', objectFit: 'cover' },
  nav: { position: 'fixed', bottom: '30px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 100 },
  neonBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  neonCore: { width: '65px', height: '65px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7 0%, #6366f1 100%)', boxShadow: '0 0 20px #a855f7', transition: 'all 0.3s' },
  neonCoreActive: { width: '65px', height: '65px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 40px #fff' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  aiText: { color: '#a855f7', fontSize: '24px', letterSpacing: '5px' }
};

export default App;
