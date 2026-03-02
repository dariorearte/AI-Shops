//BLOQUE 1: INFRAESTRUCTURA Y ESTADOS NEURALES//
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, ShoppingBag, LayoutGrid, User, Settings, Mic, Search, 
  Bell, Heart, MessageCircle, PlusCircle, Navigation, CreditCard, 
  ShieldCheck, Zap, Star, Filter, ArrowRight 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet (Pins visibles en móviles)
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ 
  iconUrl: icon, 
  shadowUrl: iconShadow, 
  iconSize: [25, 41], 
  iconAnchor: [12, 41] 
});
L.Marker.prototype.options.icon = DefaultIcon;

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  // --- NAVEGACIÓN Y PERFILES ---
  const [panel, setPanel] = useState('center'); 
  const [session, setSession] = useState(null);
  const [activeMode, setActiveMode] = useState('shopper'); 
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [hasNotifiedCategory, setHasNotifiedCategory] = useState(null); 
  const [socialItems, setSocialItems] = useState([]); 
  const [selectedItem, setSelectedItem] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 

  // --- INTELIGENCIA NEURAL (N.E.O.N. AI) ---
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiPersonality, setAiPersonality] = useState('Butler'); 
  const [learningData, setLearningData] = useState([]);
  const [transcript, setTranscript] = useState("");

  // --- NUCLEO DE INTELIGENCIA GEOGRÁFICA (SANEADO) ---
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [radius, setRadius] = useState(15);
  const [stores, setStores] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  // --- MARKETPLACE Y TRANSACCIONES ---
  const [marketItems, setMarketItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  // --- SISTEMA DE ALERTAS NEURALES ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

//BLOQUE 2: MOTORES TÁCTICOS Y ACCESO//
  // --- PUENTE DE AUTENTICACIÓN GOOGLE (SANEADO) ---
  const handleLogin = async () => {
    const notify = typeof speak === 'function' ? speak : console.log;
    notify("Iniciando protocolo de identificación con Google...");
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error("Error de enlace:", error.message);
      if (typeof speak === 'function') speak("Fallo en la sincronización de cuenta.");
    }
  };

  // --- FUNCIÓN DE BÚSQUEDA MANUAL (URL CORREGIDA OMEGA) ---  
  const setManualCity = async (city) => {
    if (!city) return;
    try {
      // URL CORREGIDA: Ruta oficial de Nominatim para evitar Error de Red
      const url = `https://nominatim.openstreetmap.org{encodeURIComponent(city)}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data.length > 0) {
        // Nominatim devuelve un array, tomamos el primer resultado táctico
        setUserLocation({ 
          lat: parseFloat(data[0].lat), 
          lng: parseFloat(data[0].lon) 
        });
        setLocationError(false);
        speak(`Radar desplegado sobre ${city}, señor.`);
      } else {
        speak("Coordenadas no encontradas en la red neural.");
      }
    } catch (e) {
      console.error("Fallo en Geocoding:", e);
      speak("Fallo en el satélite de búsqueda.");
    }
  };

  const getGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(false);
          speak("Ubicación GPS confirmada.");
        },
        (err) => {
          setLocationError(true);
          speak("Acceso denegado. Indique su ciudad manualmente.");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // --- ÚNICO EFECTO DE ARRANQUE (SINCRONIZACIÓN TOTAL) ---
  useEffect(() => {
    const initSession = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      
      if (activeSession) {
        // Usamos el ID real de la sesión para evitar ReferenceError
        fetchProfile(activeSession.user.id);
        initializeRealtime(activeSession.user.id);
      }
    };

    initSession();
    getGPS();
    fetchGlobalMarket();
  }, []);

//BLOQUE 3: NÚCLEO DE DATOS Y CANALES REAL-TIME//
  // --- OBTENCIÓN DE PERFIL Y WALLET (BLINDADO OMEGA) ---
  const fetchProfile = async (id) => {
    if (!id) return;
    try {
      // maybeSingle evita el error 406 si el registro es nuevo
      const { data: p, error: ep } = await supabase.from('perfiles').select('*').eq('id', id).maybeSingle();
      const { data: w, error: ew } = await supabase.from('wallets').select('*').eq('id', id).maybeSingle();
      
      if (p) {
        setProfile(p);
        if (p.rol) setActiveMode(p.rol);
      }
      
      if (w) {
        setWallet(w);
      } else {
        console.warn("N.E.O.N. advierte: Generando balance inicial en la red...");
      }
    } catch (err) {
      console.error("Fallo de enlace en fetchProfile:", err);
    }
  };

  // --- CONFIGURACIÓN DE CANALES DE COMUNICACIÓN (REAL-TIME) ---
  const initializeRealtime = (userId) => {
    if (!userId) return;

    // CANAL ALFA: NOTIFICACIONES PERSONALES
    const alertChannel = supabase.channel(`notificaciones-${userId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notificaciones_neon', filter: `usuario_id=eq.${userId}` }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
          speak(`Señor, nueva notificación de sistema.`);
        }
      ).subscribe();

    // CANAL BETA: CHATS DEL MARKETPLACE (C2C)
    const chatChannel = supabase.channel('marketplace-chats')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mensajes_c2c' }, 
        (payload) => {
          if (payload.new.remitente_id !== userId) {
            speak("Mensaje entrante en el Marketplace.");
          }
        }
      ).subscribe();

    // Protocolo de limpieza al desmontar
    return () => {
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(chatChannel);
    };
  };

  const fetchGlobalMarket = async () => {
    try {
      // Canal A: Productos de Tiendas (B2C)
      const { data: B2C } = await supabase.from('productos').select('*').limit(20);
      setMarketItems(B2C || []);

      // Canal B: Artículos de Usuarios (C2C)
      const { data: C2C } = await supabase.from('marketplace_c2c').select('*').order('created_at', { ascending: false });
      setSocialItems(C2C || []);
    } catch (err) {
      console.error("Fallo al obtener mercado global:", err);
    }
  };

//BLOQUE 4: MOTOR DE INDUCCIÓN NEURAL Y VOZ//
  // --- SISTEMA DE SÍNTESIS DE VOZ OMEGA ---
  const speak = (t) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Limpia la cola de mensajes
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'es-AR';
    u.pitch = aiPersonality === 'Butler' ? 0.8 : 1.4; // Ajuste de personalidad neural
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  };

  // --- RECONOCIMIENTO DE VOZ (IA ACTIVA) ---
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speak("Señor, su navegador no soporta protocolos de escucha neural.");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.lang = 'es-AR';
    rec.interimResults = false;
    
    setIsAiActive(true);
    rec.start();

    rec.onresult = (e) => {
      const cmd = e.results[0][0].transcript.toLowerCase();
      setTranscript(cmd);
      processNeuralCommand(cmd);
    };

    rec.onerror = () => setIsAiActive(false);
    rec.onend = () => setTimeout(() => setIsAiActive(false), 2000);
  };

  // --- PROCESADOR DE COMANDOS TÁCTICOS ---
  const processNeuralCommand = (cmd) => {
    speak(`Procesando orden: ${cmd}`);
    
    if (cmd.includes("radar") || cmd.includes("mapa") || cmd.includes("donde")) {
      setPanel('left');
      speak("Radar táctico en línea, Comandante.");
    }
    if (cmd.includes("tienda") || cmd.includes("comprar") || cmd.includes("feed")) {
      setPanel('center');
      speak("Accediendo al Prime Feed de tiendas.");
    }
    if (cmd.includes("marketplace") || cmd.includes("usados") || cmd.includes("social")) {
      setPanel('right');
      speak("Sincronizando con el Marketplace Social C2C.");
    }
    if (cmd.includes("vender") || cmd.includes("modo tienda")) {
      switchMode('shop');
    }
    if (cmd.includes("repartir") || cmd.includes("trabajar")) {
      switchMode('ryder');
    }

    // --- INDUCCIÓN POR INTENCIÓN (HAMBRE/GASTRONOMÍA) ---
    if (cmd.includes("hambre") || cmd.includes("comer") || cmd.includes("pizza") || cmd.includes("sushi")) {
      setFilterCategory('restaurante');
      setPanel('left'); // Cambia al mapa para ver locales cercanos
      speak("He filtrado las mejores opciones gastronómicas en su radio de acción actual.");
    }

    // --- COMANDO DE SALDO ---
    if (cmd.includes("saldo") || cmd.includes("dinero") || cmd.includes("cuenta")) {
      speak(`Señor, su saldo disponible es de ${wallet?.saldo_disponible || 0} créditos.`);
    }
  };

  const switchMode = async (mode) => {
    if (!session) return;
    speak(`Cambiando a modo ${mode.toUpperCase()}. Reconfigurando interfaz...`);
    const { error } = await supabase.from('perfiles').update({ rol: mode }).eq('id', session.user.id);
    if (!error) {
      setActiveMode(mode);
      speak(`Protocolo ${mode} activado con éxito.`);
    } else {
      speak("Error en la reconfiguración de rango.");
    }
  };

//BLOQUE 5: MOTOR C2C, ESCROW Y APRENDIZAJE NEURAL//
  // --- INYECCIÓN QUIRÚRGICA: MOTOR C2C (MARKETPLACE SOCIAL) ---
  const handleSocialPost = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file'; 
    fileInput.accept = 'image/*'; 
    fileInput.multiple = true;
    
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const nombre = prompt("¿Qué artículo desea publicar en el Marketplace?");
      const precio = prompt("Ingrese el precio en créditos:");
      
      if (!nombre || !precio) {
        speak("Publicación cancelada por falta de datos, señor.");
        return;
      }

      setIsPosting(true);
      speak("Sincronizando con la red neural... Procesando imágenes.");

      try {
        const uploadPromises = files.map(async (file) => {
          const fileName = `c2c-${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage.from('productos-fotos').upload(fileName, file);
          if (error) throw error;
          const { data: urlData } = supabase.storage.from('productos-fotos').getPublicUrl(fileName);
          return urlData.publicUrl;
        });

        const urls = await Promise.all(uploadPromises);

                // --- INSERCIÓN REPARADA ---
        const { error: insertError } = await supabase.from('marketplace_c2c').insert([{
          vendedor_id: session.user.id,
          nombre: nombre,
          precio: parseFloat(precio),
          fotos: urls, // Asegúrese de que 'urls' sea un Array [url1, url2]
          descripcion: "Publicado vía N.E.O.N. Omega"
        }]);

        if (insertError) {
          console.error("Fallo de esquema:", insertError.message);
          speak("Error de sintaxis en la base de datos.");
        } else {
          speak("Artículo sincronizado con éxito.");
          fetchGlobalMarket(); 
        }

      } catch (err) {
        console.error(err);
        speak("Error en el protocolo de subida de archivos.");
      } finally {
        setIsPosting(false);
      }
    };
    fileInput.click();
  };

  // --- MOTOR DE INDUCCIÓN NEURAL (N.E.O.N. BRAIN - APRENDIZAJE) ---
  const trackAction = (actionType, metadata) => {
    const newAction = { type: actionType, meta: metadata, timestamp: Date.now() };
    const updatedActions = [newAction, ...lastActions].slice(0, 50);
    setLastActions(updatedActions);

    // ANALÍTICA DE COMPORTAMIENTO: Si el usuario ve 3 productos de la misma categoría...
    const categoryCounts = updatedActions.reduce((acc, act) => {
      if (act.type === 'view_product') acc[act.meta.category] = (acc[act.meta.category] || 0) + 1;
      return acc;
    }, {});

    Object.keys(categoryCounts).forEach(cat => {
      if (categoryCounts[cat] === 3 && hasNotifiedCategory !== cat) {
        setHasNotifiedCategory(cat);
        speak(`Señor, he detectado un interés recurrente en ${cat}. Optimizando radar.`);
        setFilterCategory(cat);
        setTimeout(() => setPanel('left'), 800);
        setTimeout(() => setHasNotifiedCategory(null), 120000); // Reset de memoria en 2 min
      }
    });
  };

  // --- PROTOCOLO DE FIDEICOMISO (ESCROW) ---
  const processEscrowPayment = async (orderId, amount) => {
    if (!wallet || wallet.saldo_disponible < amount) {
      speak("Saldo insuficiente en su wallet neural, señor.");
      return;
    }

    speak(`Iniciando protocolo de Fideicomiso N.E.O.N. por ${amount} créditos.`);
    
    // Retenemos el dinero en la wallet del comprador
    const { error: walletError } = await supabase.from('wallets').update({
      saldo_disponible: wallet.saldo_disponible - amount,
      saldo_retenido: wallet.saldo_retenido + amount
    }).eq('id', session.user.id);

    if (!walletError) {
      await supabase.from('pedidos').update({ estado: 'pago_retenido' }).eq('id', orderId);
      speak("Fondos asegurados. El pago se liberará al confirmar la entrega.");
    } else {
      speak("Fallo en la retención de créditos.");
    }
  };

//BLOQUE 6: ACCESO AL ECOSISTEMA Y HEADER TÁCTICO//
  // --- CONDICIONAL DE ACCESO (LOGIN) ---
  if (!session) return (
    <div style={styles.loginPage}>
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
        transition={{ repeat: Infinity, duration: 5 }} 
        style={styles.neonLogoLarge}
      >
        N.E.O.N.
      </motion.div>
      <p style={{letterSpacing: '5px', fontSize: '10px', marginBottom: '30px', color: '#a855f7'}}>
        NEURAL EXPERIENCE OPTIMIZED NETWORK
      </p>
      <button onClick={handleLogin} style={styles.mainBtn}>ACCEDER AL ECOSISTEMA</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* HEADER PREMIUM DINÁMICO */}
      <header style={styles.header}>
        <Settings 
          size={20} 
          onClick={() => speak(`Protocolo ${aiPersonality} activo. Rango actual: ${profile?.rango || 'RECLUTA'}.`)} 
          style={{cursor:'pointer'}}
        />
        
        <div style={{textAlign: 'center'}}>
          <h1 style={styles.logoText}>N.E.O.N.</h1>
          <p style={{fontSize: '8px', opacity: 0.5, letterSpacing: '2px'}}>
            RADIO: {radius}KM | {profile?.rango?.toUpperCase() || 'BRONCE'}
          </p>
        </div>

        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          {/* CENTRO DE NOTIFICACIONES */}
          <div 
            style={{position: 'relative', cursor: 'pointer'}} 
            onClick={() => { setUnreadCount(0); speak("Centro de notificaciones sincronizado."); }}
          >
            <Bell size={20} color={unreadCount > 0 ? '#a855f7' : '#fff'} />
            {unreadCount > 0 && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                style={styles.notificationBadge}
              >
                {unreadCount}
              </motion.div>
            )}
          </div>

          {/* AVATAR DE USUARIO / LOGIN */}
          <div style={styles.avatarCircle}>
            <User 
              size={25} 
              onClick={() => {
                setPanel('profile');
                speak(`Comandante ${profile?.nombre || 'Neon'}, accediendo a su perfil neural.`);
              }} 
              style={{ cursor: 'pointer', color: '#a855f7' }} 
            />
          </div>
        </div>
      </header>

      {/* VIEWPORT PRINCIPAL (CONTENEDOR DE PANELES) */}
      <div style={styles.viewport}>
        <AnimatePresence mode="wait">
                    {/* PANEL IZQUIERDO: RADAR TÁCTICO GEOLOCALIZADO (SANEADO) */}
          {panel === 'left' && (
            <motion.div key="left" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} style={styles.panelFull}>
              <h3 style={styles.panelHeader}>RADAR DE OPERACIONES</h3>
              
              {/* BUSCADOR SIEMPRE VISIBLE Y CON PRIORIDAD ABSOLUTA (Z-INDEX 10000) */}
              {(!userLocation || locationError) && (
                <div style={styles.locationFallback}>
                  <p style={{fontSize: '11px', marginBottom: '15px', color: '#a855f7', letterSpacing: '2px'}}>
                    {locationError ? "SISTEMA GPS BLOQUEADO - MODO MANUAL" : "SINCRONIZANDO CON SATÉLITES..."}
                  </p>
                  <div style={{position: 'relative', zIndex: 10000}}>
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Ingrese ciudad (ej: Rosario, Argentina)" 
                      style={styles.inputSearch}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setManualCity(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                  </div>
                  <button onClick={getGPS} style={{marginTop: '15px', color: '#a855f7', fontSize: '10px', background: 'none', border: '1px solid #a855f7', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer'}}>
                    REINTENTAR TRIANGULACIÓN GPS
                  </button>
                </div>
              )}

              {/* CONTENEDOR DEL MAPA DINÁMICO */}
              {userLocation && (
                <div style={styles.mapCanvas}>
                  <MapContainer 
                    center={[userLocation.lat, userLocation.lng]} 
                    zoom={13} 
                    style={{height: '100%', width: '100%', zIndex: 1}}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* ÁREA DE INFLUENCIA NEURAL */}
                    <Circle 
                      center={[userLocation.lat, userLocation.lng]} 
                      radius={radius * 1000} 
                      pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.1, weight: 1 }} 
                    />

                    {/* PIN DE UBICACIÓN COMANDANTE */}
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>Usted está aquí, Comandante. Radio de {radius}km activo.</Popup>
                    </Marker>

                    {/* RENDERIZADO DE TIENDAS CERCANAS (Si existen en 'stores') */}
                    {stores.map(store => (
                      <Marker key={store.id} position={[store.lat, store.lng]}>
                        <Popup><b>{store.nombre}</b><br/>{store.categoria}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>

                  {/* INFO DE RADAR SOBREPUESTA */}
                  <div style={styles.radarInfo}>
                    PRECISIÓN: ALTA | SATÉLITES: 08 | SECTOR: {userLocation.lat.toFixed(4)} / {userLocation.lng.toFixed(4)}
                  </div>
                </div>
              )}

              {/* CONTROL DE RADIO DE ACCIÓN */}
              <div style={styles.radiusControl}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px'}}>
                  <span>RADIO DE ACCIÓN</span>
                  <span style={{color: '#a855f7'}}>{radius} KM</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="50" 
                  value={radius} 
                  onChange={(e) => setRadius(parseInt(e.target.value))} 
                  style={styles.slider} 
                />
              </div>
            </motion.div>
          )}

                    {/* PANEL CENTRAL: PRIME FEED (MARKETPLACE DE TIENDAS) */}
          {panel === 'center' && (
            <motion.div key="center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.panelFull}>
              
              {/* RECOMENDACIÓN IA DINÁMICA */}
              <section style={styles.aiRecommendation}>
                <Zap size={14} color="#fff" />
                <p>RECOMENDACIÓN DE {aiPersonality.toUpperCase()}: "Neon Burger tiene un 20% off en su radio actual."</p>
              </section>

              {/* CARRUSEL DE HISTORIAS / PROMOS FLASH */}
              <div style={styles.storiesRow}>
                {['Sushi', 'Pizza', 'Tech', 'Ropa', 'Farmacia'].map((story, i) => (
                  <div key={i} style={styles.storyCircle} onClick={() => {
                    setFilterCategory(story.toLowerCase());
                    speak(`Filtrando promociones de ${story}, señor.`);
                  }}>
                    <ShoppingBag size={20} color="#a855f7" />
                  </div>
                ))}
              </div>

              {/* BANNER DE PROMOCIÓN OMEGA */}
              <div style={styles.promoCard}>
                <div>
                  <h4 style={{fontSize: '14px', marginBottom: '5px'}}>N.E.O.N. PLUS</h4>
                  <p style={{fontSize: '10px', opacity: 0.8}}>Envíos GRATIS en todo el sector de {radius}km.</p>
                </div>
                <ArrowRight size={24} color="#fff" />
              </div>

              {/* SELECTOR DE CATEGORÍAS RÁPIDO */}
              <div style={styles.categoryScroller}>
                {['Todos', 'Restaurantes', 'Electrónica', 'Moda', 'Hogar'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setFilterCategory(cat === 'Todos' ? 'all' : cat.toLowerCase())} 
                    style={{
                      ...styles.categoryBtn, 
                      borderColor: filterCategory === cat.toLowerCase() ? '#a855f7' : '#1a1a1a',
                      background: filterCategory === cat.toLowerCase() ? '#111' : '#0a0a0a'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* FEED DE PRODUCTOS B2C (TIENDAS) */}
              <div style={styles.feedGrid}>
                {marketItems.filter(i => filterCategory === 'all' || i.categoria === filterCategory).map(item => (
                  <div 
                    key={item.id} 
                    style={styles.premiumCard} 
                    onClick={() => {
                      trackAction('view_product', { category: item.categoria, name: item.nombre });
                      speak(`Analizando detalles de ${item.nombre}.`);
                    }}
                  >
                    <div style={styles.productBadge}>DESTACADO</div>
                    <div style={styles.productImg}>
                      <ShoppingBag size={24} opacity={0.1}/>
                    </div>
                    <div style={styles.premiumInfo}>
                      <b style={{fontSize: '13px'}}>{item.nombre}</b>
                      <div style={styles.priceRow}>
                        <span style={{color: '#a855f7', fontWeight: 'bold'}}>${item.precio}</span>
                        <button 
                          style={styles.addMiniBtn} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCart([...cart, item]);
                            speak(`${item.nombre} añadido al carrito neural.`);
                          }}
                        >
                          <PlusCircle size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

  /*          {/* PANEL DERECHO: NEURAL MARKETPLACE (C2C SOCIAL) */}
          {panel === 'right' && (
            <motion.div key="right" initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} style={styles.panelFull}>
              <div style={styles.marketHeader}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <LayoutGrid size={20} color="#a855f7" />
                  <h3 style={{fontSize: '16px', letterSpacing: '3px'}}>MARKETPLACE SOCIAL</h3>
                </div>
                {/* BOTÓN DE PUBLICAR ARTÍCULO */}
                <PlusCircle 
                  size={28} 
                  color="#a855f7" 
                  onClick={handleSocialPost} 
                  style={{cursor:'pointer', filter: 'drop-shadow(0 0 10px #a855f7)'}} 
                />
              </div>

              {/* GRID DE ARTÍCULOS SOCIALES (C2C) */}
              <div style={styles.socialGrid}>
                {socialItems.length > 0 ? socialItems.map(item => (
                  <motion.div 
                    key={item.id} 
                    whileTap={{ scale: 0.95 }}
                    style={styles.socialCard} 
                    onClick={() => {
                      setSelectedItem(item);
                      if (item.vendedor_id === session?.user?.id) {
                        speak(`Abriendo su publicación: ${item.nombre}.`);
                      } else {
                        speak(`Analizando artículo: ${item.nombre}.`);
                      }
                    }}
                  >
                    <div style={styles.socialImg}>
                       <img 
                         src={item.fotos?.[0] || 'https://via.placeholder.com'} 
                         style={{width:'100%', height:'100%', objectFit:'cover'}} 
                         alt="Social Item" 
                       />
                       {/* BADGE DE PRECIO NEÓN */}
                       <div style={{position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '10px', border: '1px solid #a855f7'}}>
                         <span style={{color: '#fff', fontSize: '10px'}}>${item.precio}</span>
                       </div>
                    </div>
                    <div style={styles.socialMeta}>
                       <b style={{fontSize:'11px', display: 'block', marginBottom: '5px'}}>{item.nombre}</b>
                       <button 
                         style={styles.chatBtn} 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           speak(`Iniciando negociación segura por ${item.nombre}, señor.`); 
                         }}
                       >
                         <MessageCircle size={12}/> CONSULTAR
                       </button>
                    </div>
                  </motion.div>
                )) : (
                  <div style={{gridColumn: '1/3', padding: '50px 20px', textAlign: 'center', opacity: 0.5}}>
                    <p style={{fontSize: '10px', letterSpacing: '2px'}}>NO HAY ARTÍCULOS EN SU SECTOR AÚN.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NAVEGACIÓN FLOTANTE (MOTOR DE PANELES) */}
      <nav style={styles.bottomNav}>
        <button 
          onClick={() => { setPanel('left'); speak("Cambiando a Radar Táctico."); }} 
          style={panel === 'left' ? styles.activeIcon : styles.navIcon}
        >
          <Map size={22}/>
        </button>
        <button 
          onClick={() => { setPanel('center'); speak("Regresando al Prime Feed."); }} 
          style={panel === 'center' ? styles.activeIcon : styles.navIcon}
        >
          <ShoppingBag size={22}/>
        </button>
        <button 
          onClick={() => { setPanel('right'); speak("Accediendo al Marketplace Social."); }} 
          style={panel === 'right' ? styles.activeIcon : styles.navIcon}
        >
          <LayoutGrid size={22}/>
        </button>
      </nav>
            {/* CORE N.E.O.N. (IA - BOTÓN FLOTANTE) */}
      <div onClick={toggleVoice} style={styles.aiCoreBtn}>
        <motion.div 
          animate={isAiActive ? { scale: [1, 1.3, 1], rotate: 360 } : {}} 
          transition={{ repeat: Infinity }} 
          style={styles.aiOrb} 
        />
      </div>

      <AnimatePresence>
        {/* MODAL IA: ESCUCHA NEURAL */}
        {isAiActive && (
          <motion.div 
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
            style={styles.aiOverlay}
            key="ai-layer"
          >
             <p style={styles.aiTranscript}>{transcript || "ESCUCHANDO ORDEN NEURAL..."}</p>
             <div style={styles.aiWaveform}>
                {[1,2,3,4,5].map(i => (
                  <motion.div 
                    key={i} 
                    animate={{ height: [10, 40, 10] }} 
                    transition={{ repeat: Infinity, delay: i*0.1 }} 
                    style={styles.waveBar} 
                  />
                ))}
             </div>
          </motion.div>
        )}

        {/* OVERLAY DE DETALLE DE ARTÍCULO (EXPERIENCIA C2C) */}
        {selectedItem && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
            style={styles.detailOverlay}
            key="detail-layer"
          >
            <div style={styles.detailHeader}>
              <button 
                onClick={() => { setSelectedItem(null); setIsEditing(false); }} 
                style={styles.backBtn}
              >✕</button>
              <h3 style={{fontSize: '12px', letterSpacing: '3px'}}>DETALLE DEL ARTÍCULO</h3>
              {session?.user?.id === selectedItem.vendedor_id && (
                <button 
                  onClick={() => {
                    if(isEditing) speak("Sincronizando cambios en la red neural.");
                    setIsEditing(!isEditing);
                  }} 
                  style={styles.editBtn}
                >
                  {isEditing ? 'GUARDAR' : 'EDITAR'}
                </button>
              )}
            </div>

            <div style={styles.detailScroll}>
              {/* GALERÍA DE FOTOS PREMIUM */}
              <div style={styles.detailGallery}>
                {selectedItem.fotos?.map((f, i) => (
                  <img key={i} src={f} style={styles.galleryImg} alt="Neural Preview" />
                ))}
              </div>

              <div style={styles.detailContent}>
                {isEditing ? (
                  <div style={styles.editForm}>
                    <input defaultValue={selectedItem.nombre} style={styles.inputEdit} placeholder="Nombre del artículo" />
                    <input defaultValue={selectedItem.precio} style={styles.inputEdit} placeholder="Precio créditos" />
                    <textarea defaultValue={selectedItem.descripcion} style={styles.textEdit} placeholder="Descripción neural" />
                  </div>
                ) : (
                  <>
                    <h2 style={styles.detailTitle}>{selectedItem.nombre}</h2>
                    <b style={styles.detailPrice}>
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(selectedItem.precio)}
                    </b>
                    <p style={styles.detailDesc}>{selectedItem.descripcion || 'Sin descripción proporcionada.'}</p>
                    
                    <div style={styles.sellerInfo}>
                      <div style={styles.avatarMini}><User size={14}/></div>
                      <p style={{fontSize: '11px'}}>Vendedor: {selectedItem.vendedor_id === session?.user?.id ? 'Tú (Propietario)' : 'ID-NEON-SECURE'}</p>
                    </div>
                  </>
                )}

                {/* ACCIONES DE MERCADO */}
                {selectedItem.vendedor_id !== session?.user?.id && (
                  <div style={styles.actionGroup}>
                    <button style={styles.chatActionBtn} onClick={() => speak(`Abriendo canal de chat para ${selectedItem.nombre}.`)}>
                      <MessageCircle size={18} /> ENVIAR MENSAJE
                    </button>
                    <button style={styles.buyActionBtn} onClick={() => processEscrowPayment(selectedItem.id, selectedItem.precio)}>
                      COMPRAR AHORA
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; // <--- AQUÍ TERMINA EL COMPONENTE APP

const styles = {
  container: { 
    background: '#000', 
    minHeight: '100vh', 
    color: '#fff', 
    fontFamily: 'Inter, sans-serif', 
    overflow: 'hidden' 
  },
  loginPage: { 
    height: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    textAlign: 'center' 
  },
  neonLogoLarge: { 
    fontSize: '60px', 
    fontWeight: '900', 
    letterSpacing: '15px', 
    color: '#a855f7', 
    textShadow: '0 0 30px #a855f7' 
  },
  mainBtn: { 
    background: 'none', 
    border: '1px solid #a855f7', 
    color: '#fff', 
    padding: '15px 40px', 
    borderRadius: '40px', 
    letterSpacing: '3px', 
    cursor: 'pointer', 
    fontSize: '12px' 
  },
  header: { 
    height: '80px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '0 25px', 
    borderBottom: '1px solid #111' 
  },
  logoText: { 
    fontSize: '18px', 
    letterSpacing: '5px', 
    fontWeight: '900', 
    color: '#a855f7' 
  },
  avatarCircle: { 
    width: '35px', 
    height: '35px', 
    borderRadius: '50%', 
    background: '#111', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    border: '1px solid #333' 
  },
  viewport: { 
    height: 'calc(100vh - 160px)', 
    overflowY: 'auto', 
    padding: '15px' 
  },
  panelFull: { 
    width: '100%' 
  },
  panelHeader: { 
    fontSize: '14px', 
    letterSpacing: '3px', 
    marginBottom: '20px', 
    textAlign: 'center', 
    color: '#a855f7' 
  },
  mapCanvas: { 
    height: '350px', 
    background: 'radial-gradient(circle, #0a0a0a 0%, #000 100%)', 
    borderRadius: '30px', 
    position: 'relative', 
    overflow: 'hidden', 
    border: '1px solid #111' 
  },
  locationFallback: { 
    padding: '40px 20px', 
    textAlign: 'center', 
    background: '#0a0a0a', 
    borderRadius: '30px', 
    border: '1px solid #a855f7' 
  },
  inputSearch: { 
    background: '#111', 
    border: '1px solid #a855f7', 
    color: '#fff', 
    padding: '15px', 
    borderRadius: '15px', 
    width: '100%', 
    textAlign: 'center', 
    outline: 'none', 
    fontSize: '14px',
    pointerEvents: 'auto' // CLAVE: Habilita el teclado sobre el mapa
  },
  radarInfo: { 
    position: 'absolute', 
    bottom: '20px', 
    left: '20px',
    fontSize: '8px', 
    letterSpacing: '2px', 
    opacity: 0.5,
    zIndex: 10
  },
  radiusControl: { 
    marginTop: '25px', 
    padding: '0 10px' 
  },
  slider: { 
    width: '100%', 
    accentColor: '#a855f7', 
    marginTop: '10px' 
  },
  // --- CONTINUACIÓN DEL OBJETO STYLES ---
  storiesRow: { display: 'flex', gap: '15px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '10px' },
  storyCircle: { minWidth: '55px', height: '55px', borderRadius: '50%', border: '2px solid #a855f7', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', cursor: 'pointer' },
  promoCard: { height: '100px', background: 'linear-gradient(90deg, #a855f7 0%, #6366f1 100%)', borderRadius: '25px', padding: '0 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  feedGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  premiumCard: { background: 'rgba(255,255,255,0.02)', borderRadius: '25px', border: '1px solid #111', overflow: 'hidden', position: 'relative', marginBottom: '15px', cursor: 'pointer' },
  productBadge: { position: 'absolute', top: '12px', left: '12px', background: '#a855f7', fontSize: '8px', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', zIndex: 2 },
  productImg: { width: '100%', aspectRatio: '1/1', background: '#111', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  premiumInfo: { padding: '15px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  addMiniBtn: { background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer' },
  marketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  socialGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  socialCard: { background: '#0a0a0a', borderRadius: '15px', height: '220px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid #111' },
  socialImg: { width: '100%', height: '140px', background: '#111' },
  socialMeta: { padding: '10px' },
  chatBtn: { background: '#111', color: '#a855f7', border: '1px solid #a855f7', borderRadius: '10px', padding: '5px 10px', fontSize: '10px', width: '100%', marginTop: '5px' },
  bottomNav: { position: 'fixed', bottom: '25px', left: '10%', width: '80%', height: '65px', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid #222', zIndex: 100 },
  navIcon: { background: 'none', border: 'none', color: '#fff', opacity: 0.3, cursor: 'pointer' },
  activeIcon: { background: 'none', border: 'none', color: '#a855f7', opacity: 1, cursor: 'pointer' },
  aiCoreBtn: { position: 'fixed', bottom: '100px', right: '25px', zIndex: 101, cursor: 'pointer' },
  aiOrb: { width: '55px', height: '55px', borderRadius: '50%', background: 'radial-gradient(circle, #a855f7, #6366f1)', boxShadow: '0 0 25px rgba(168, 85, 247, 0.6)' },
  aiOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  aiTranscript: { color: '#a855f7', fontSize: '20px', letterSpacing: '4px', textAlign: 'center', maxWidth: '80%' },
  aiWaveform: { display: 'flex', gap: '5px', marginTop: '30px', alignItems: 'center' },
  waveBar: { width: '4px', background: '#a855f7', borderRadius: '2px' },
  aiRecommendation: { background: 'linear-gradient(90deg, #a855f7, #6366f1)', padding: '12px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', marginBottom: '20px', fontWeight: 'bold' },
  categoryScroller: { display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '10px' },
  categoryBtn: { background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: '25px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' },
  notificationBadge: { position: 'absolute', top: -5, right: -5, background: '#ff0055', color: '#fff', fontSize: '8px', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', border: '1px solid #000' },
  detailOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' },
  detailHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111' },
  detailScroll: { flex: 1, overflowY: 'auto' },
  detailGallery: { display: 'flex', overflowX: 'auto', background: '#0a0a0a', height: '300px' },
  galleryImg: { height: '100%', width: '100%', objectFit: 'cover', flexShrink: 0 },
  detailContent: { padding: '25px' },
  detailTitle: { fontSize: '22px', fontWeight: 'bold' },
  detailPrice: { fontSize: '20px', color: '#a855f7', margin: '10px 0', display: 'block' },
  detailDesc: { fontSize: '14px', opacity: 0.7, lineHeight: '1.6' },
  sellerInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: '#0a0a0a', borderRadius: '15px', margin: '20px 0' },
  avatarMini: { width: '30px', height: '30px', borderRadius: '50%', background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  actionGroup: { display: 'flex', gap: '10px', marginTop: '20px' },
  chatActionBtn: { flex: 1, background: '#111', color: '#fff', border: '1px solid #333', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '10px', fontWeight: 'bold' },
  buyActionBtn: { flex: 1, background: '#a855f7', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' },
  editBtn: { background: '#a855f7', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '10px', fontSize: '10px' },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '20px' },
  inputEdit: { background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '10px', marginBottom: '10px', width: '100%' },
  textEdit: { background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '10px', width: '100%', height: '100px', resize: 'none' }
}; // <--- AQUÍ TERMINA EL OBJETO STYLES

export default App; // <--- AQUÍ TERMINA EL ARCHIVO
