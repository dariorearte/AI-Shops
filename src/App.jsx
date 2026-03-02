  //BLOQUE 1: Arquitectura de Importaciones y Estados//
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, ShoppingBag, LayoutGrid, User, Settings, Mic, Search, Bell, Heart, MessageCircle, PlusCircle, Navigation, CreditCard, ShieldCheck, Zap, Star, Filter, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  const [panel, setPanel] = useState('center'); 
  const [session, setSession] = useState(null);
  const [activeMode, setActiveMode] = useState('shopper'); 
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [hasNotifiedCategory, setHasNotifiedCategory] = useState(null); 
  const [marketItems, setMarketItems] = useState([]);
  const [socialItems, setSocialItems] = useState([]); 
  const [cart, setCart] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiPersonality, setAiPersonality] = useState('Butler'); 
  const [transcript, setTranscript] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [radius, setRadius] = useState(15);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastActions, setLastActions] = useState([]);

  //BLOQUE 2: Motores de Lógica (GPS, Auth y Realtime)//
  const speak = (t) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'es-AR';
    u.pitch = aiPersonality === 'Butler' ? 0.8 : 1.4;
    window.speechSynthesis.speak(u);
  };

  const fetchProfile = async (id) => {
    if (!id) return;
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', id).maybeSingle();
    const { data: w } = await supabase.from('wallets').select('*').eq('id', id).maybeSingle();
    if (p) { setProfile(p); setActiveMode(p.rol || 'shopper'); }
    if (w) setWallet(w);
  };

  const fetchGlobalMarket = async () => {
    const { data: B2C } = await supabase.from('productos').select('*').limit(20);
    const { data: C2C } = await supabase.from('marketplace_c2c').select('*').order('created_at', { ascending: false });
    setMarketItems(B2C || []);
    setSocialItems(C2C || []);
  };

  const initializeRealtime = (userId) => {
    if (!userId) return;
    const alertChannel = supabase.channel(`notificaciones-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones_neon', filter: `usuario_id=eq.${userId}` }, 
      (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        speak(`Señor, nueva notificación de sistema.`);
      }).subscribe();

    const chatChannel = supabase.channel('marketplace-chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_c2c' }, 
      (payload) => {
        if (payload.new.remitente_id !== userId) speak("Mensaje entrante en el Marketplace.");
      }).subscribe();

    return () => { supabase.removeChannel(alertChannel); supabase.removeChannel(chatChannel); };
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) { fetchProfile(session.user.id); initializeRealtime(session.user.id); }
    };
    init();
    getGPS();
    fetchGlobalMarket();
  }, []);

  const getGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationError(false); },
        () => setLocationError(true),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const setManualCity = async (city) => {
    if (!city) return;
    try {
      const url = `https://nominatim.openstreetmap.org{encodeURIComponent(city)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        setUserLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setLocationError(false);
        speak(`Radar desplegado sobre ${city}.`);
      }
    } catch (e) { speak("Fallo en el satélite de búsqueda."); }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  //BLOQUE 3: Interfaz de Usuario (JSX Principal)//
  const trackAction = (actionType, metadata) => {
    const updatedActions = [{ type: actionType, meta: metadata, timestamp: Date.now() }, ...lastActions].slice(0, 50);
    setLastActions(updatedActions);
  };

  if (!session) return (
    <div style={styles.loginPage}>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 5 }} style={styles.neonLogoLarge}>N.E.O.N.</motion.div>
      <button onClick={handleLogin} style={styles.mainBtn}>ACCEDER AL ECOSISTEMA</button>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Settings size={20} onClick={() => speak("Configuraciones listas.")} />
        <h1 style={styles.logoText}>N.E.O.N.</h1>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
          <Bell size={20} color={unreadCount > 0 ? '#a855f7' : '#fff'} onClick={() => setUnreadCount(0)} />
          <User size={25} onClick={() => setPanel('profile')} color="#a855f7" />
        </div>
      </header>

      <div style={styles.viewport}>
        <AnimatePresence mode="wait">
          {panel === 'left' && (
            <motion.div key="left" initial={{ x: -300 }} animate={{ x: 0 }} style={styles.panelFull}>
              {!userLocation && (
                <div style={{...styles.locationFallback, position: 'relative', zIndex: 10000}}>
                  <input placeholder="Ingrese ciudad..." style={styles.inputSearch} onKeyDown={(e) => e.key === 'Enter' && setManualCity(e.target.value)} />
                </div>
              )}
              {userLocation && (
                <div style={styles.mapCanvas}>
                  <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{height: '100%', width: '100%'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Circle center={[userLocation.lat, userLocation.lng]} radius={radius * 1000} pathOptions={{ color: '#a855f7' }} />
                  </MapContainer>
                </div>
              )}
            </motion.div>
          )}

          {panel === 'center' && (
            <motion.div key="center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.panelFull}>
              <div style={styles.feedGrid}>
                {marketItems.map(item => (
                  <div key={item.id} style={styles.productCard} onClick={() => trackAction('view_product', { category: item.categoria })}>
                    <b>{item.nombre}</b>
                    <p>${item.precio}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {panel === 'right' && (
            <motion.div key="right" initial={{ x: 300 }} animate={{ x: 0 }} style={styles.panelFull}>
              <div style={styles.socialGrid}>
                {socialItems.map(item => (
                  <div key={item.id} style={styles.socialCard} onClick={() => setSelectedItem(item)}>
                    <img src={item.fotos?.[0]} style={styles.socialImg} alt="C2C" />
                    <div style={styles.socialMeta}><b>{item.nombre}</b></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav style={styles.bottomNav}>
        <Map onClick={() => setPanel('left')} style={panel === 'left' ? styles.activeIcon : styles.navIcon} />
        <ShoppingBag onClick={() => setPanel('center')} style={panel === 'center' ? styles.activeIcon : styles.navIcon} />
        <LayoutGrid onClick={() => setPanel('right')} style={panel === 'right' ? styles.activeIcon : styles.navIcon} />
      </nav>

      {selectedItem && (
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={styles.detailOverlay}>
          <button onClick={() => setSelectedItem(null)}>CERRAR</button>
          <h2>{selectedItem.nombre}</h2>
        </motion.div>
      )}
    </div>
  );
};

  //BLOQUE 4: Blindaje de Estilos Final//
const styles = {
  container: { background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
  loginPage: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
  neonLogoLarge: { fontSize: '60px', fontWeight: '900', letterSpacing: '15px', color: '#a855f7', textShadow: '0 0 30px #a855f7' },
  mainBtn: { background: 'none', border: '1px solid #a855f7', color: '#fff', padding: '15px 40px', borderRadius: '40px', cursor: 'pointer' },
  header: { height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 25px', borderBottom: '1px solid #111' },
  logoText: { fontSize: '18px', letterSpacing: '5px', color: '#a855f7' },
  avatarCircle: { width: '35px', height: '35px', borderRadius: '50%', background: '#111', border: '1px solid #333' },
  viewport: { height: 'calc(100vh - 160px)', overflowY: 'auto', padding: '15px' },
  panelFull: { width: '100%' },
  mapCanvas: { height: '400px', borderRadius: '30px', overflow: 'hidden' },
  locationFallback: { padding: '40px', textAlign: 'center', background: '#0a0a0a', borderRadius: '30px', border: '1px solid #a855f7' },
  inputSearch: { background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '15px', width: '100%', textAlign: 'center' },
  feedGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  productCard: { background: '#0a0a0a', borderRadius: '25px', padding: '15px', border: '1px solid #111' },
  socialGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  socialCard: { background: '#0a0a0a', borderRadius: '15px', height: '180px', overflow: 'hidden', position: 'relative' },
  socialImg: { width: '100%', height: '100%', objectFit: 'cover' },
  socialMeta: { position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: '5px' },
  bottomNav: { position: 'fixed', bottom: '25px', left: '10%', width: '80%', height: '65px', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid #222', zIndex: 100 },
  navIcon: { color: '#fff', opacity: 0.3, cursor: 'pointer' },
  activeIcon: { color: '#a855f7', opacity: 1, cursor: 'pointer' },
  detailOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 1000, padding: '20px' }
};

export default App;
