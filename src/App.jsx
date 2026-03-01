import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, ShoppingBag, LayoutGrid, User, Settings, Mic, Search, 
  Bell, Heart, MessageCircle, PlusCircle, Navigation, 
  CreditCard, ShieldCheck, Zap, Star, Filter, ArrowRight 
} from 'lucide-react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  // --- NAVEGACIÓN Y PERFILES ---
  const [panel, setPanel] = useState('center'); // left, center, right
  const [session, setSession] = useState(null);
  const [activeMode, setActiveMode] = useState('shopper'); // shopper, shop, ryder
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);

  // --- INTELIGENCIA NEURAL (N.E.O.N. AI) ---
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiPersonality, setAiPersonality] = useState('Butler'); 
  const [learningData, setLearningData] = useState([]);
  const [transcript, setTranscript] = useState("");

  // --- MOTOR GEOGRÁFICO Y FILTROS ---
  const [radius, setRadius] = useState(15); // 1km a 500km
  const [userLocation, setUserLocation] = useState({ lat: -34.6037, lng: -58.3816 }); // Default Buenos Aires
  const [stores, setStores] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  // --- MARKETPLACE Y TRANSACCIONES ---
  const [marketItems, setMarketItems] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        initializeRealtime();
      }
    });
    fetchGlobalMarket();
  }, []);

  const fetchProfile = async (id) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', id).single();
    const { data: w } = await supabase.from('wallets').select('*').eq('id', id).single();
    setProfile(p);
    setWallet(w);
    if (p?.rol) setActiveMode(p.rol);
  };

  const initializeRealtime = () => {
    supabase.channel('pedidos-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, payload => {
        speak("Señor, el estado de su orden ha sido actualizado en la red.");
      }).subscribe();
  };

  const speak = (t) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'es-AR';
    u.pitch = aiPersonality === 'Butler' ? 0.8 : 1.4;
    u.rate = 1.1;
    window.speechSynthesis.speak(u);
  };
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("N.E.O.N. requiere un motor de voz compatible.");
    
    const rec = new SpeechRecognition();
    rec.lang = 'es-AR';
    setIsAiActive(true);
    rec.start();

    rec.onresult = (e) => {
      const cmd = e.results.transcript.toLowerCase();
      setTranscript(cmd);
      processNeuralCommand(cmd);
    };
    rec.onend = () => setTimeout(() => setIsAiActive(false), 2000);
  };

  const processNeuralCommand = (cmd) => {
    if (cmd.includes("radar") || cmd.includes("mapa")) setPanel('left');
    if (cmd.includes("tienda") || cmd.includes("comprar")) setPanel('center');
    if (cmd.includes("marketplace") || cmd.includes("usados")) setPanel('right');
    if (cmd.includes("modo tienda") || cmd.includes("vender")) switchMode('shop');
    
    // Inducción Neural: Si el usuario suena con hambre
    if (cmd.includes("hambre") || cmd.includes("comer")) {
      setFilterCategory('restaurante');
      setPanel('left');
      speak(`He filtrado las mejores opciones gastronómicas en un radio de ${radius} kilómetros, señor.`);
    }
  };

  const switchMode = async (mode) => {
    const { error } = await supabase.from('perfiles').update({ rol: mode }).eq('id', session.user.id);
    if (!error) {
      setActiveMode(mode);
      speak(`Sistemas reconfigurados. Modo ${mode === 'shop' ? 'Shop' : mode === 'ryder' ? 'Ryder' : 'Shopper'} activado.`);
    }
  };

  const fetchGlobalMarket = async () => {
    const { data } = await supabase.from('productos').select('*').limit(20);
    setMarketItems(data || []);
  };
  if (!session) return (
    <div style={styles.loginPage}>
      <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 5 }} style={styles.neonLogoLarge}>N.E.O.N.</motion.div>
      <p style={{letterSpacing: '5px', fontSize: '10px', marginBottom: '30px'}}>NEURAL EXPERIENCE OPTIMIZED NETWORK</p>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} style={styles.mainBtn}>ACCEDER AL ECOSISTEMA</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* HEADER PREMIUM */}
      <header style={styles.header}>
        <Settings size={20} onClick={() => speak("Configuraciones de N.E.O.N. listas.")} style={{cursor:'pointer'}}/>
        <div style={{textAlign: 'center'}}>
          <h1 style={styles.logoText}>N.E.O.N. <span style={{color: '#fff', fontSize: '10px'}}>OMEGA</span></h1>
          <p style={{fontSize: '8px', opacity: 0.5}}>RADIO: {radius}KM | {profile?.rango || 'BRONCE'}</p>
        </div>
        <div style={styles.avatarCircle}><User size={18} /></div>
      </header>

      {/* VIEWPORT DE TRIPLE PANEL */}
      <div style={styles.viewport}>
        <AnimatePresence mode="wait">
          {/* PANEL IZQUIERDO: RADAR TÁCTICO GEOLOCALIZADO */}
          {panel === 'left' && (
            <motion.div key="left" initial={{ x: -500 }} animate={{ x: 0 }} exit={{ x: -500 }} style={styles.panelFull}>
              <div style={styles.panelHeader}>
                <Navigation size={18} color="#a855f7" /> <h3>RADAR TÁCTICO</h3>
              </div>
              <div style={styles.searchBox}><Search size={16}/><input placeholder="Filtrar por rubro o producto..." style={styles.inputInv} /></div>
              
              <div style={styles.mapCanvas}>
                 <div style={styles.userPin}><div style={styles.userPulse}/></div>
                 {/* Aquí se inyectan los pins dinámicos de tiendas */}
                 <div style={styles.radarInfo}>Escaneando {filterCategory === 'all' ? 'todos los rubros' : filterCategory}...</div>
              </div>
              
              <div style={styles.radiusControl}>
                <p>Radio de Alcance: {radius}km</p>
                <input type="range" min="1" max="500" value={radius} onChange={(e) => setRadius(e.target.value)} style={styles.slider} />
              </div>
            </motion.div>
          )}

          {/* PANEL CENTRAL: PRIME FEED (MARKETPLACE DE TIENDAS) */}
          {panel === 'center' && (
            <motion.div key="center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.panelFull}>
              <div style={styles.storiesRow}>
                {[1,2,3,4,5].map(i => <div key={i} style={styles.storyCircle}><Zap size={14} color="#a855f7"/></div>)}
              </div>
              <div style={styles.promoCard}>
                 <div style={styles.promoContent}>
                    <h4>OFERTA NEURAL</h4>
                    <p>Basado en tus gustos de hoy...</p>
                 </div>
                 <ArrowRight size={20} />
              </div>
              <div style={styles.feedGrid}>
                {marketItems.map(item => (
                  <div key={item.id} style={styles.productCard}>
                    <div style={styles.productImg}><ShoppingBag size={24} opacity={0.1}/></div>
                    <div style={styles.productInfo}>
                      <b>{item.nombre}</b>
                      <span style={{color: '#a855f7'}}>${item.precio}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PANEL DERECHO: NEURAL MARKETPLACE (C2C SOCIAL) */}
          {panel === 'right' && (
            <motion.div key="right" initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} style={styles.panelFull}>
              <div style={styles.marketSearch}>
                <h3>MARKETPLACE C2C</h3>
                <PlusCircle size={24} color="#a855f7" />
              </div>
              <div style={styles.socialGrid}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={styles.socialCard}>
                    <div style={styles.socialImg} />
                    <div style={styles.socialMeta}>
                      <Heart size={14} /> <MessageCircle size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NAVEGACIÓN FLOTANTE */}
      <nav style={styles.bottomNav}>
        <button onClick={() => setPanel('left')} style={panel === 'left' ? styles.activeIcon : styles.navIcon}><Map size={22}/></button>
        <button onClick={() => setPanel('center')} style={panel === 'center' ? styles.activeIcon : styles.navIcon}><ShoppingBag size={22}/></button>
        <button onClick={() => setPanel('right')} style={panel === 'right' ? styles.activeIcon : styles.navIcon}><LayoutGrid size={22}/></button>
      </nav>

      {/* CORE N.E.O.N. (IA) */}
      <div onClick={toggleVoice} style={styles.aiCoreBtn}>
        <motion.div animate={isAiActive ? { scale: [1, 1.3, 1], rotate: 360 } : {}} transition={{ repeat: Infinity }} style={styles.aiOrb} />
      </div>

      <AnimatePresence>
        {isAiActive && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={styles.aiOverlay}>
             <p style={styles.aiTranscript}>{transcript || "ESCUCHANDO ORDEN NEURAL..."}</p>
             <div style={styles.aiWaveform}>
                {[1,2,3,4,5].map(i => <motion.div key={i} animate={{ height: [10, 40, 10] }} transition={{ repeat: Infinity, delay: i*0.1 }} style={styles.waveBar} />)}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
  loginPage: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
  neonLogoLarge: { fontSize: '60px', fontWeight: '900', letterSpacing: '15px', color: '#a855f7', textShadow: '0 0 30px #a855f7' },
  mainBtn: { background: 'none', border: '1px solid #a855f7', color: '#fff', padding: '15px 40px', borderRadius: '40px', letterSpacing: '3px', cursor: 'pointer', fontSize: '12px' },
  header: { height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 25px', borderBottom: '1px solid #111' },
  logoText: { fontSize: '18px', letterSpacing: '5px', fontWeight: '900', color: '#a855f7' },
  avatarCircle: { width: '35px', height: '35px', borderRadius: '50%', background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #333' },
  viewport: { height: 'calc(100vh - 160px)', overflowY: 'auto', padding: '15px' },
  panelFull: { width: '100%' },
  panelHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  searchBox: { background: '#0a0a0a', padding: '12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #111' },
  inputInv: { background: 'none', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '13px' },
  mapCanvas: { height: '350px', background: 'radial-gradient(circle, #0a0a0a 0%, #000 100%)', borderRadius: '30px', position: 'relative', overflow: 'hidden', border: '1px solid #111', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  userPin: { width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 15px #fff', position: 'relative' },
  userPulse: { position: 'absolute', top: -10, left: -10, width: '32px', height: '32px', border: '1px solid #fff', borderRadius: '50%', opacity: 0.3 },
  radarInfo: { position: 'absolute', bottom: '20px', fontSize: '10px', letterSpacing: '2px', opacity: 0.5 },
  radiusControl: { marginTop: '25px', padding: '0 10px' },
  slider: { width: '100%', accentColor: '#a855f7', marginTop: '10px' },
  storiesRow: { display: 'flex', gap: '15px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '10px' },
  storyCircle: { minWidth: '55px', height: '55px', borderRadius: '50%', border: '2px solid #a855f7', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a' },
  promoCard: { height: '100px', background: 'linear-gradient(90deg, #a855f7 0%, #6366f1 100%)', borderRadius: '25px', padding: '0 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  feedGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  productCard: { background: '#0a0a0a', borderRadius: '25px', padding: '15px', border: '1px solid #111' },
  productImg: { width: '100%', aspectRatio: '1/1', background: '#111', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  productInfo: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px' },
  marketSearch: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  socialGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  socialCard: { background: '#0a0a0a', borderRadius: '15px', height: '180px', overflow: 'hidden', position: 'relative' },
  socialImg: { width: '100%', height: '100%', background: '#111' },
  socialMeta: { position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: '10px' },
  bottomNav: { position: 'fixed', bottom: '25px', left: '10%', width: '80%', height: '65px', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid #222', zIndex: 100 },
  navIcon: { background: 'none', border: 'none', color: '#fff', opacity: 0.3, cursor: 'pointer' },
  activeIcon: { background: 'none', border: 'none', color: '#a855f7', opacity: 1, cursor: 'pointer' },
  aiCoreBtn: { position: 'fixed', bottom: '100px', right: '25px', zIndex: 101, cursor: 'pointer' },
  aiOrb: { width: '55px', height: '55px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7, #6366f1)', boxShadow: '0 0 25px rgba(168, 85, 247, 0.6)' },
  aiOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  aiTranscript: { color: '#a855f7', fontSize: '20px', letterSpacing: '4px', textAlign: 'center', maxWidth: '80%' },
  aiWaveform: { display: 'flex', gap: '5px', marginTop: '30px', alignItems: 'center' },
  waveBar: { width: '4px', background: '#a855f7', borderRadius: '2px' }
};

export default App;
