import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, ShoppingBag, LayoutGrid, User, Settings, Mic, Search, Bell, Heart, MessageCircle, PlusCircle, Navigation, CreditCard, ShieldCheck, Zap, Star, Filter, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet (Si no, los pins no se verán)
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;


const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App = () => {
  // --- NAVEGACIÓN Y PERFILES ---
  const [panel, setPanel] = useState('center'); // left, center, right
  const [session, setSession] = useState(null);
  const [activeMode, setActiveMode] = useState('shopper'); // shopper, shop, ryder
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [hasNotifiedCategory, setHasNotifiedCategory] = useState(null); // Evita repeticiones
  const [socialItems, setSocialItems] = useState([]); // Canal exclusivo C2C
  const [selectedItem, setSelectedItem] = useState(null); // Artículo en foco
  const [isEditing, setIsEditing] = useState(false); // Switch de edición


  // --- INTELIGENCIA NEURAL (N.E.O.N. AI) ---
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiPersonality, setAiPersonality] = useState('Butler'); 
  const [learningData, setLearningData] = useState([]);
  const [transcript, setTranscript] = useState("");

    // 1. Iniciamos en null para saber que aún no tenemos posición
  const [userLocation, setUserLocation] = useState(null); 
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    // Intentar obtener GPS real al arrancar
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          speak("Ubicación GPS confirmada. Radar sincronizado.");
        },
        () => {
          setLocationError(true);
          speak("Acceso a ubicación denegado. Por favor, indique su ciudad de operaciones.");
        }
      );
    }
  }, []);

  // Función para cargar ciudad manualmente (Geocoding)
  const setManualCity = async (city) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org{city}`);
      const data = await res.json();
      if (data.length > 0) {
        setUserLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setLocationError(false);
        speak(`Desplegando radar sobre ${city}.`);
      } else {
        speak("Ciudad no encontrada en la red neural.");
      }
    } catch (e) {
      speak("Error de conexión con el satélite de búsqueda.");
    }
  };

  // --- MOTOR GEOGRÁFICO Y FILTROS ---
  const [radius, setRadius] = useState(15); // 1km a 500km
  const [stores, setStores] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  // --- MARKETPLACE Y TRANSACCIONES ---
  const [marketItems, setMarketItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  // --- SISTEMA DE ALERTAS NEURALES ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);


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

    const initializeRealtime = (userId) => {
    if (!userId) return;

    // CANAL ALFA: NOTIFICACIONES PERSONALES
    const alertChannel = supabase.channel(`notificaciones-${userId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notificaciones_neon', filter: `usuario_id=eq.${userId}` }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
          speak(`Señor, nueva notificación de ${payload.new.tipo || 'sistema'}.`);
        }
      ).subscribe();

    // CANAL BETA: CHATS DEL MARKETPLACE
    const chatChannel = supabase.channel('marketplace-chats')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mensajes_c2c' }, 
        (payload) => {
          if (payload.new.remitente_id !== userId) {
            speak("Mensaje entrante en el Marketplace.");
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(chatChannel);
    };
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

    // --- INYECCIÓN QUIRÚRGICA: MOTOR C2C ---
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
      
      if (!nombre || !precio) return speak("Publicación cancelada por falta de datos.");

      speak("Sincronizando con la red neural... Por favor, aguarde.");

      try {
        const uploadPromises = files.map(async (file) => {
          const fileName = `c2c-${Date.now()}-${file.name}`;
          const { data } = await supabase.storage.from('productos-fotos').upload(fileName, file);
          const { data: urlData } = supabase.storage.from('productos-fotos').getPublicUrl(fileName);
          return urlData.publicUrl;
        });

        const urls = await Promise.all(uploadPromises);

        await supabase.from('marketplace_c2c').insert([{
          vendedor_id: session.user.id,
          nombre,
          precio: parseFloat(precio),
          fotos: urls
        }]);

        speak("Artículo publicado con éxito en el ecosistema social.");
        fetchGlobalMarket(); 
      } catch (err) {
        speak("Error en el protocolo de subida.");
        console.error(err);
      }
    };
    fileInput.click();
  };

    const fetchGlobalMarket = async () => {
    // Canal A: Productos de Tiendas (B2C)
    const { data: B2C } = await supabase.from('productos').select('*').limit(20);
    setMarketItems(B2C || []);

    // Canal B: Artículos de Usuarios (C2C)
    const { data: C2C } = await supabase.from('marketplace_c2c').select('*').order('created_at', { ascending: false });
    setSocialItems(C2C || []);
  };

    // --- MOTOR DE INDUCCIÓN NEURAL (N.E.O.N. BRAIN) ---
  const [neuralScore, setNeuralScore] = useState(0);
  const [lastActions, setLastActions] = useState([]);

    const trackAction = (actionType, metadata) => {
    const newAction = { type: actionType, meta: metadata, timestamp: Date.now() };
    const updatedActions = [newAction, ...lastActions].slice(0, 50);
    setLastActions(updatedActions);

      const handleSocialPost = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.multiple = true;
    
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const nombre = prompt("¿Qué está vendiendo, señor?");
      const precio = prompt("¿Precio de salida?");
      
      setIsPosting(true);
      speak("Procesando imágenes en la red neural... Por favor, aguarde.");

      try {
        const uploadPromises = files.map(async (file) => {
          const fileName = `${Math.random()}-${file.name}`;
          const { data } = await supabase.storage.from('productos-fotos').upload(fileName, file);
          return supabase.storage.from('productos-fotos').getPublicUrl(fileName).data.publicUrl;
        });

        const urls = await Promise.all(uploadPromises);

        await supabase.from('marketplace_c2c').insert([{
          vendedor_id: session.user.id,
          nombre,
          precio: parseFloat(precio),
          fotos: urls,
          estado_articulo: 'usado_como_nuevo'
        }]);

        speak("Artículo publicado con éxito en el Marketplace Social. Los Ryders cercanos ya han sido notificados para logística potencial.");
        fetchGlobalMarket(); // Refrescar vista
      } catch (err) {
        speak("Error en el protocolo de subida.");
      } finally {
        setIsPosting(false);
      }
    };
    fileInput.click();
  };

    
    const categoryCounts = updatedActions.reduce((acc, act) => {
      if (act.type === 'view_product') acc[act.meta.category] = (acc[act.meta.category] || 0) + 1;
      return acc;
    }, {});

    Object.keys(categoryCounts).forEach(cat => {
      // OPTIMIZACIÓN: Solo actúa si llega a 3 clics Y no ha notificado esta categoría antes
      if (categoryCounts[cat] === 3 && hasNotifiedCategory !== cat) {
        setHasNotifiedCategory(cat); // Marcamos como notificado
        
        speak(`Señor, he detectado un interés recurrente en ${cat}. He optimizado el radar para usted.`);
        
        // FIX: Forzamos el cambio de interfaz al radar (Izquierda)
        setFilterCategory(cat);
        setTimeout(() => {
          setPanel('left'); // Cambio automático con delay para que se escuche la voz
        }, 500);

        // Resetear la memoria de la IA después de 2 minutos para que pueda volver a sugerir otros rubros
        setTimeout(() => setHasNotifiedCategory(null), 120000); 
      }
    });
  };

  const processEscrowPayment = async (orderId, amount) => {
    if (!wallet || wallet.saldo_disponible < amount) return speak("Saldo insuficiente, señor.");
    speak(`Iniciando protocolo de Fideicomiso N.E.O.N. por ${amount} créditos.`);
    const { error } = await supabase.from('wallets').update({
      saldo_disponible: wallet.saldo_disponible - amount,
      saldo_retenido: wallet.saldo_retenido + amount
    }).eq('id', session.user.id);
    if (!error) {
      await supabase.from('pedidos').update({ estado: 'pago_retenido' }).eq('id', orderId);
      speak("Fondos asegurados.");
    }
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
          <h1 style={styles.logoText}>N.E.O.N.</h1>
          <p style={{fontSize: '8px', opacity: 0.5}}>RADIO: {radius}KM | {profile?.rango || 'BRONCE'}</p>
        </div>
        <div style={styles.avatarCircle}><User size={18} /></div>
        <div style={{position: 'relative', cursor: 'pointer'}} onClick={() => { setUnreadCount(0); speak("Centro de notificaciones sincronizado."); }}>
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
      </header>

      {/* VIEWPORT DE TRIPLE PANEL */}
      <div style={styles.viewport}>
        <AnimatePresence mode="wait">
          {/* PANEL IZQUIERDO: RADAR TÁCTICO GEOLOCALIZADO */}
            {panel === 'left' && (
            <motion.div key="left" initial={{ x: -300 }} animate={{ x: 0 }} style={styles.panel}>
              <h3>RADAR TÁCTICO</h3>
              
              {!userLocation ? (
                <div style={styles.locationFallback}>
                  <p style={{fontSize: '12px', marginBottom: '15px', opacity: 0.7}}>
                    {locationError ? "GPS BLOQUEADO" : "SINCRONIZANDO SATÉLITES..."}
                  </p>
                  <input 
                    placeholder="Ingrese Ciudad (ej: Rosario, Madrid...)" 
                    onKeyDown={(e) => e.key === 'Enter' && setManualCity(e.target.value)}
                    style={styles.inputSearch}
                  />
                  <p style={{fontSize: '10px', marginTop: '10px'}}>Presione Enter para confirmar</p>
                </div>
              ) : (
                <div style={styles.mapCanvas}>
                  <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{height: '100%'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'/>
                    <Circle center={[userLocation.lat, userLocation.lng]} radius={radius * 1000} pathOptions={{ color: '#a855f7' }} />
                  </MapContainer>
                </div>
              )}
            </motion.div>
          )}

          {/* PANEL CENTRAL: PRIME FEED (MARKETPLACE DE TIENDAS) */}
                    {panel === 'center' && (
            <motion.div key="center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.panelFull}>
              <section style={styles.aiRecommendation}>
                <Zap size={14} color="#fff" />
                <p>RECOMENDACIÓN DE {aiPersonality.toUpperCase()}: "Neon Burger tiene un 20% off ahora"</p>
              </section>

              <div style={styles.categoryScroller}>
                {['Sushis', 'Pizzas', 'Tech', 'Ropa', 'Farmacia'].map(cat => (
                  <button key={cat} onClick={() => setFilterCategory(cat.toLowerCase())} style={styles.categoryBtn}>{cat}</button>
                ))}
              </div>

              <div style={styles.feedGrid}>
                {marketItems.map(item => (
                  <div key={item.id} style={styles.premiumCard} onClick={() => trackAction('view_product', { category: item.categoria })}>
                    <div style={styles.productBadge}>DESTACADO</div>
                    <div style={styles.productImg}><ShoppingBag size={24} opacity={0.1}/></div>
                    <div style={styles.premiumInfo}>
                      <b>{item.nombre}</b>
                      <div style={styles.priceRow}>
                        <span>${item.precio}</span>
                        <button style={styles.addMiniBtn}><PlusCircle size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}


          {/* PANEL DERECHO: NEURAL MARKETPLACE (C2C SOCIAL) */}
                      {panel === 'right' && (
            <motion.div key="right" initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} style={styles.panelFull}>
              <div style={styles.marketHeader}>
                <h3>NEURAL MARKETPLACE</h3>
                <PlusCircle size={24} color="#a855f7" onClick={handleSocialPost} style={{cursor:'pointer'}} />
              </div>

              <div style={styles.socialGrid}>
                {socialItems.length > 0 ? socialItems.map(item => (
                    <div key={item.id} style={styles.socialCard} onClick={() => {setSelectedItem(item);
                    if (item.vendedor_id === session.user.id) {
                      speak(`Abriendo su publicación: ${item.nombre}. Modo edición disponible.`);
                      } else {
                      speak(`Analizando artículo: ${item.nombre}.`);
                    }
                  }}>

                    <div style={styles.socialImg}>
                       {/* Mostramos la primera foto del array 'fotos' */}
                       <img src={item.fotos?.[0] || 'https://via.placeholder.com'} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    </div>
                    <div style={styles.socialMeta}>
                       <b style={{fontSize:'11px'}}>{item.nombre}</b>
                       <span style={{color:'#a855f7', fontSize:'10px'}}>${item.precio}</span>
                       <button style={styles.chatBtn} onClick={() => speak(`Iniciando negociación por ${item.nombre}`)}>CONSULTAR</button>
                    </div>
                  </div>
                )) : (
                  <p style={{fontSize:'10px', opacity:0.5, textAlign:'center', gridColumn:'1/3'}}>No hay artículos sociales en su zona aún.</p>
                )}
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
        {/* OVERLAY DE DETALLE DE ARTÍCULO (ESTILO MARKETPLACE PRO) */}
  <AnimatePresence>
    {selectedItem && (
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={styles.detailOverlay}>
        <div style={styles.detailHeader}>
          <button onClick={() => { setSelectedItem(null); setIsEditing(false); }} style={styles.backBtn}>✕</button>
          <h3>DETALLE DEL ARTÍCULO</h3>
          {selectedItem.vendedor_id === session.user.id && (
            <button onClick={() => setIsEditing(!isEditing)} style={styles.editBtn}>
              {isEditing ? 'GUARDAR' : 'EDITAR'}
            </button>
          )}
        </div>

        <div style={styles.detailScroll}>
          {/* Carrusel de Fotos */}
          <div style={styles.detailGallery}>
            {selectedItem.fotos?.map((f, i) => (
              <img key={i} src={f} style={styles.galleryImg} alt="Preview" />
            ))}
          </div>

          <div style={styles.detailContent}>
            {isEditing ? (
              <div style={styles.editForm}>
                <input defaultValue={selectedItem.nombre} style={styles.inputEdit} />
                <input defaultValue={selectedItem.precio} style={styles.inputEdit} />
                <textarea defaultValue={selectedItem.descripcion || 'Sin descripción'} style={styles.textEdit} />
              </div>
            ) : (
              <>
                <h2 style={styles.detailTitle}>{selectedItem.nombre}</h2>
                <b style={styles.detailPrice}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(selectedItem.precio)}</b>
                <b style={styles.detailPrice}>$ {new Intl.NumberFormat('es-AR').format(selectedItem.precio)}</b>
                <p style={styles.detailDesc}>{selectedItem.descripcion || 'El vendedor no proporcionó una descripción neural.'}</p>
                
                <div style={styles.sellerInfo}>
                  <div style={styles.avatarMini}><User size={14}/></div>
                  <p>Vendedor: {selectedItem.vendedor_id === session.user.id ? 'Tú (Propietario)' : 'Usuario N.E.O.N.'}</p>
                </div>
              </>
            )}

            {selectedItem.vendedor_id !== session.user.id && (
              <div style={styles.actionGroup}>
                <button style={styles.chatActionBtn} onClick={() => speak("Iniciando chat seguro...")}>
                  <MessageCircle size={18} /> ENVIAR MENSAJE
                </button>
                <button style={styles.buyActionBtn} onClick={() => speak("Procesando compra directa...")}>
                  COMPRAR AHORA
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
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
  waveBar: { width: '4px', background: '#a855f7', borderRadius: '2px' },
  aiRecommendation: { background: 'linear-gradient(90deg, #a855f7, #6366f1)', padding: '12px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', marginBottom: '20px', fontWeight: 'bold' },
  categoryScroller: { display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '10px' },
  categoryBtn: { background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: '25px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' },
  premiumCard: { background: 'rgba(255,255,255,0.02)', borderRadius: '25px', border: '1px solid #111', overflow: 'hidden', position: 'relative', marginBottom: '15px' },
  productBadge: { position: 'absolute', top: '12px', left: '12px', background: '#a855f7', fontSize: '8px', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', zIndex: 2 },
  premiumInfo: { padding: '15px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  addMiniBtn: { background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer' },
  detailOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' },
  detailHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111' },
  detailScroll: { flex: 1, overflowY: 'auto' },
  detailGallery: { display: 'flex', overflowX: 'auto', gap: '2px', background: '#0a0a0a', height: '300px' },
  galleryImg: { height: '100%', width: '100%', objectFit: 'cover', flexShrink: 0 },
  detailContent: { padding: '25px' },
  detailTitle: { fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' },
  detailPrice: { fontSize: '20px', color: '#a855f7', display: 'block', marginBottom: '15px' },
  detailDesc: { fontSize: '14px', opacity: 0.7, lineHeight: '1.6', marginBottom: '20px' },
  sellerInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: '#0a0a0a', borderRadius: '15px', marginBottom: '25px' },
  actionGroup: { display: 'flex', gap: '10px' },
  chatActionBtn: { flex: 1, background: '#111', color: '#fff', border: '1px solid #333', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '10px', fontWeight: 'bold' },
  buyActionBtn: { flex: 1, background: '#a855f7', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' },
  inputEdit: { background: '#111', border: '1px solid #a855f7', color: '#fff', padding: '10px', width: '100%', marginBottom: '10px', borderRadius: '10px' },
  notificationBadge: { position: 'absolute', top: -5, right: -5, background: '#ff0055', color: '#fff', fontSize: '8px', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', border: '1px solid #000',boxShadow: '0 0 10px rgba(255,0,85,0.5)',
  locationFallback: { padding: '40px 20px', textAlign: 'center', background: '#0a0a0a', borderRadius: '30px', border: '1px solid #a855f7' },
  inputSearch: { background: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '15px', width: '100%', outline: 'none', textAlign: 'center' },

  },

};

export default App;
