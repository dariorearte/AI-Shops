import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ShoppingBag, User, MapPin, Bike, Star, Clock, X, Plus, Minus, 
  Trash2, CreditCard, Banknote, Loader, CheckCircle2, ChevronRight,
  Utensils, Smartphone, Shirt, Pill, ShoppingCart, LogOut, Search, Moon, Sun, Sparkles
} from 'lucide-react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { supabase } from './supabaseClient';

// --- CONFIGURACIÓN DE ICONOS LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com',
  iconUrl: 'https://unpkg.com',
  shadowUrl: 'https://unpkg.com',
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
      setTimeout(() => map.invalidateSize(), 400);
    }
  }, [position, map]);
  return null;
}

function App() {
  // --- 1. ESTADOS DE PERSISTENCIA ---
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem('ai_user')) || null);
  const [carrito, setCarrito] = useState(() => JSON.parse(localStorage.getItem('ai_cart')) || []);
  const [historialPedidos, setHistorialPedidos] = useState(() => JSON.parse(localStorage.getItem('ai_history')) || []);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('ai_dark')) ?? true);
  const [mostrarCupon, setMostrarCupon] = useState(false);
  const [codigoCupon, setCodigoCupon] = useState("");


  // --- 2. ESTADOS DE NAVEGACIÓN ---
  const [tabActiva, setTabActiva] = useState("inicio");
  const [busqueda, setBusqueda] = useState("");
  const [position, setPosition] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [verMenu, setVerMenu] = useState(false);
  const [verMenuUsuario, setVerMenuUsuario] = useState(false);
  const [enCheckout, setEnCheckout] = useState(false);
  const [rastreando, setRastreando] = useState(false);
  const [motoPos, setMotoPos] = useState(null);
  const [pedidoEntregado, setPedidoEntregado] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // --- 3. ESTADOS DE IA ---
  const [sugerenciaIA, setSugerenciaIA] = useState(null);
  const [pensandoIA, setPensandoIA] = useState(false);
  const [itemSugeridoIA, setItemSugeridoIA] = useState(null);

  // --- 4. EFECTOS ---
  useEffect(() => {
    localStorage.setItem('ai_user', JSON.stringify(usuario));
    localStorage.setItem('ai_cart', JSON.stringify(carrito));
    localStorage.setItem('ai_history', JSON.stringify(historialPedidos));
    localStorage.setItem('ai_dark', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [usuario, carrito, historialPedidos, darkMode]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setPosition([lat, lng]);
      const dataTiendas = [
        { id: 1, nombre: "Café AI", cat: "gastronomia", lat: lat + 0.003, lng: lng + 0.003, color: '#EF4444', 
          productos: [
            {id: 101, n: "Espresso Italiano", p: 1200, img: "https://images.unsplash.com"}, 
            {id: 102, n: "Muffin Arándanos", p: 800, img: "https://images.unsplash.com"}
          ] 
        },
        { id: 2, nombre: "Tech Store", cat: "tecnologia", lat: lat - 0.003, lng: lng - 0.003, color: '#3B82F6', 
          productos: [
            {id: 201, n: "Cargador Pro", p: 4500, img: "https://images.unsplash.com"},
            {id: 202, n: "Audífonos In-Ear", p: 8500, img: "https://images.unsplash.com"}
          ] 
        }
      ];
      setTiendas(dataTiendas);
    });
  }, []);
  // --- 5. LÓGICA DE NEGOCIO ---
    const handleLoginSuccess = (res) => {
    const decoded = jwtDecode(res.credential);
    
    // Aquí es donde creamos el "DNI" completo del usuario
    const datosUsuario = { 
      nombre: decoded.given_name, 
      foto: decoded.picture,
      email: decoded.email // <--- ¡ESTA ES LA PIEZA QUE FALTABA!
    };
    
    setUsuario(datosUsuario);
    // Lo guardamos de inmediato en la memoria del navegador
    localStorage.setItem('ai_user', JSON.stringify(datosUsuario));
    setVerMenuUsuario(false);
  };


    const agregarAlCarrito = (p, esSugerencia = false) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === p.id);
      if (existe) return prev.map(i => i.id === p.id ? {...i, cant: i.cant + 1} : i);
      return [...prev, {...p, cant: 1, tId: tiendaSeleccionada?.id || prev[0]?.tId}];
    });

    if (esSugerencia) {
      setCodigoCupon("AISHOP15");
      setMostrarCupon(true);
      setSugerenciaIA(null);
      setItemSugeridoIA(null);
    }
  };


  const quitarDelCarrito = (id) => {
    setCarrito(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.cant > 1) return prev.map(i => i.id === id ? {...i, cant: i.cant - 1} : i);
      return prev.filter(i => i.id !== id);
    });
  };

  const consultarIA = () => {
    setPensandoIA(true);
    setTimeout(() => {
      const items = carrito.map(i => i.n.toLowerCase());
      if (items.some(n => n.includes("espresso")) && !items.some(n => n.includes("muffin"))) {
        setSugerenciaIA("Tu Espresso se siente solo. ¿Agregamos un Muffin de Arándanos recién horneado?");
        setItemSugeridoIA({id: 102, n: "Muffin Arándanos", p: 800, img: "https://images.unsplash.com"});
      } else if (items.some(n => n.includes("cargador")) && !items.some(n => n.includes("audífonos"))) {
        setSugerenciaIA("Kit tech incompleto. Los Audífonos In-Ear Pro son el match perfecto.");
        setItemSugeridoIA({id: 202, n: "Audífonos In-Ear", p: 8500, img: "https://images.unsplash.com"});
      } else {
        setSugerenciaIA("¡Tu selección es perfecta! No detecto optimizaciones necesarias por ahora.");
        setItemSugeridoIA(null);
      }
      setPensandoIA(false);
    }, 1200);
  };

  const confirmarPedido = () => {
    setEnCheckout(true);
    setTimeout(() => {
      setEnCheckout(false); setTabActiva("inicio"); setRastreando(true);
      const tId = carrito[0]?.tId || 1;
      const tOrigen = tiendas.find(t => t.id === tId) || tiendas[0];
      setMotoPos([tOrigen.lat, tOrigen.lng]);
      let t = 0;
      const interval = setInterval(() => {
        t += 0.05;
        if (t >= 1) { clearInterval(interval); setMotoPos(position); setPedidoEntregado(true); }
        else setMotoPos([tOrigen.lat + (position[0] - tOrigen.lat) * t, tOrigen.lng + (position[1] - tOrigen.lng) * t]);
      }, 1000);
    }, 1500);
  };

  const finalizarPedidoYLimpiar = async () => {
    // Buscamos el email en el estado o en la memoria por si acaso
    const emailReal = usuario?.email || JSON.parse(localStorage.getItem('ai_user'))?.email || 'anonimo@aishops.com';
    
    const totalFinal = carrito.reduce((acc, i) => acc + (i.p * i.cant), 0);

    const nuevoPedidoNube = { 
      usuario_email: emailReal, // <--- Ahora sí usará tu Gmail real
      tienda_nombre: "AI Shop", 
      total: totalFinal, 
      items: carrito,
      fecha: new Date().toISOString()
    };

    try {
      // 1. GUARDAR EN SUPABASE (Nube)
      const { error } = await supabase
        .from('pedidos')
        .insert([nuevoPedidoNube]);

      if (error) throw error;
      console.log("🚀 Sincronización exitosa con Supabase");

    } catch (err) {
      console.error("❌ Error de Nube:", err.message);
      // No rompemos la app, seguimos el flujo local aunque falle la nube
    }

    // 2. ACTUALIZAR HISTORIAL LOCAL (Para visualización inmediata)
    const pedidoLocal = { 
      id: 'AI-' + Math.random().toString(36).substr(2,4).toUpperCase(), 
      ...nuevoPedidoNube 
    };
    
    setHistorialPedidos(prev => [pedidoLocal, ...prev]);
    
    // 3. LIMPIEZA DE ESTADOS (Orden correcto para evitar pantalla blanca)
    setRastreando(false); 
    setPedidoEntregado(false); 
    setCarrito([]); 
    setMotoPos(null);
    setTiendaSeleccionada(null); // Limpiamos la tienda para cerrar la card
    setTabActiva("pedidos"); // Saltamos al historial para ver el éxito
  };

  const totalCarrito = carrito.reduce((acc, i) => acc + (i.p * i.cant), 0);
  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
      
      {/* HEADER */}
      <header className="z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b dark:border-slate-800 p-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setTabActiva("inicio"); setVerMenu(false); setTiendaSeleccionada(null);}}>
          <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center font-black text-white dark:text-slate-900">AI</div>
          <h1 className="text-xl font-black italic dark:text-white">Shops</h1>
        </div>
        <button onClick={() => setVerMenuUsuario(!verMenuUsuario)} className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border dark:border-slate-700">
          {usuario ? <img src={usuario.foto} className="w-full h-full object-cover"/> : <User size={20} className="dark:text-white"/>}
        </button>
      </header>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {tabActiva === "inicio" && (
          <div className="h-full w-full relative">
            {position && (
              <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <RecenterMap position={position} />
                <Marker position={position} icon={L.divIcon({ html: `<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>` })} />
                {tiendas.filter(t => t.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(t => (
                  <Marker key={t.id} position={[t.lat, t.lng]} eventHandlers={{ click: () => setTiendaSeleccionada(t) }}
                    icon={L.divIcon({ html: `<div class="w-10 h-10 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center text-white" style="background-color: ${t.color}"><MapPin size={18}/></div>` })}
                  />
                ))}
                {rastreando && motoPos && <Marker position={motoPos} icon={L.divIcon({ html: `<div class="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg text-white animate-bounce"><Bike size={18}/></div>` })} />}
              </MapContainer>
            )}

            {/* TRACKER MOTO */}
            {rastreando && (
              <div className="absolute top-4 left-4 right-4 z-50 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                <div className={`p-3 rounded-2xl text-white ${pedidoEntregado ? 'bg-green-500' : 'bg-blue-600'}`}>{pedidoEntregado ? <CheckCircle2 size={24}/> : <Bike size={24}/>}</div>
                <div className="flex-1 text-left font-bold dark:text-white">{pedidoEntregado ? "¡Llegó!" : "En camino"}</div>
                {pedidoEntregado && <button onClick={finalizarPedidoYLimpiar} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl"><X size={20}/></button>}
              </div>
            )}

            {/* CARD TIENDA */}
            {tiendaSeleccionada && !rastreando && (
              <div className="absolute bottom-6 left-4 right-4 z-40 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-5 flex items-center justify-between border dark:border-slate-800">
                <div className="text-left"><h2 className="font-black text-xl dark:text-white">{tiendaSeleccionada.nombre}</h2><p className="text-xs text-slate-400">4.9 ★ 15-20 min</p></div>
                <div className="flex gap-2"><button onClick={() => setTiendaSeleccionada(null)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl dark:text-white"><X size={18}/></button><button onClick={() => setVerMenu(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl font-black uppercase text-[10px]">Menú</button></div>
              </div>
            )}
          </div>
        )}

        {tabActiva === "pedidos" && (
          <div className="p-8 h-full bg-white dark:bg-slate-950 overflow-y-auto">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black dark:text-white italic uppercase">Historial</h2><button onClick={() => setTabActiva("inicio")} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl dark:text-white"><X size={20}/></button></div>
            {historialPedidos.map(p => (
              <div key={p.id} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl mb-4 flex justify-between border dark:border-slate-800">
                <div className="text-left"><p className="font-black dark:text-white">{p.tienda}</p><p className="text-xs text-slate-400">{p.fecha} • ${p.total}</p></div>
                <CheckCircle2 className="text-green-500" size={20}/>
              </div>
            ))}
          </div>
        )}

        {tabActiva === "carrito" && (
          <div className="p-8 h-full bg-white dark:bg-slate-950 overflow-y-auto pb-32">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black dark:text-white italic uppercase tracking-tighter">Tu Bolsa</h2><button onClick={() => setTabActiva("inicio")} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl dark:text-white"><X size={20}/></button></div>
            
            {carrito.length === 0 ? <p className="text-center opacity-20 py-20 font-bold dark:text-white">Vacío</p> : (
              <div className="flex flex-col gap-6">
                {/* AI ENGINE INTERACTIVO */}
                <div className="p-6 bg-gradient-to-br from-blue-600 to-purple-700 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                  <Sparkles className="absolute right-[-10px] top-[-10px] opacity-20 group-hover:scale-150 transition-transform duration-700" size={80}/>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Star size={16}/> AI Optimizador</div>
                    <button onClick={consultarIA} disabled={pensandoIA} className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-md">{pensandoIA ? "Procesando..." : "Analizar"}</button>
                  </div>
                  {sugerenciaIA && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <p className="text-sm font-bold italic mb-4 leading-tight">"{sugerenciaIA}"</p>
                      {itemSugeridoIA && (
                        <button onClick={() => agregarAlCarrito(itemSugeridoIA, true)} className="w-full bg-white text-slate-900 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus size={14}/> Agregar {itemSugeridoIA.n}</button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">{carrito.map(i => (
                  <div key={i.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-800">
                    <div className="flex items-center gap-3"><img src={i.img} className="w-12 h-12 rounded-xl object-cover" /><p className="font-bold dark:text-white text-sm">{i.cant}x {i.n}</p></div>
                    <div className="flex items-center gap-3"><button onClick={() => quitarDelCarrito(i.id)} className="p-1 dark:text-white"><Minus size={14}/></button><p className="font-black dark:text-white">$ {i.p * i.cant}</p><button onClick={() => agregarAlCarrito(i)} className="p-1 dark:text-white"><Plus size={14}/></button></div>
                  </div>
                ))}</div>

                <button onClick={confirmarPedido} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[24px] shadow-2xl text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                  {enCheckout ? <Loader className="animate-spin" size={24}/> : `Pagar • $ ${totalCarrito}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODAL MENU */}
        {verMenu && tiendaSeleccionada && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
            <div className="bg-white dark:bg-slate-900 w-full rounded-t-[40px] p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full">
              <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black dark:text-white italic">{tiendaSeleccionada.nombre}</h2><button onClick={() => setVerMenu(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full dark:text-white"><X size={20}/></button></div>
              <div className="space-y-4 mb-10">{tiendaSeleccionada.productos.map(p => {
                const cant = carrito.find(i => i.id === p.id)?.cant || 0;
                return (
                  <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border dark:border-slate-800">
                    <img src={p.img} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                    <div className="flex-1 text-left"><p className="font-bold dark:text-white text-sm">{p.n}</p><p className="font-black text-sm text-blue-600">$ {p.p}</p></div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                      <button onClick={() => quitarDelCarrito(p.id)} className="p-1 text-red-500"><Minus size={18}/></button>
                      <span className="font-black text-sm dark:text-white w-4 text-center">{cant}</span>
                      <button onClick={() => agregarAlCarrito(p)} className="p-1 text-green-600"><Plus size={18}/></button>
                    </div>
                  </div>
                );
              })}</div>
              <button onClick={() => {setVerMenu(false); setTabActiva("carrito");}} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-xl uppercase text-xs tracking-widest">Confirmar Selección ({carrito.length})</button>
            </div>
          </div>
        )}

        {/* MENU USUARIO */}
        {verMenuUsuario && (
          <div className="fixed inset-0 z-50 flex justify-end p-6 bg-black/20" onClick={() => setVerMenuUsuario(false)}>
            <div className="w-64 h-fit bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-4 animate-in slide-in-from-right-10" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col gap-3 text-left">
                {usuario ? <p className="font-bold dark:text-white px-2 leading-none">Hola, {usuario.nombre}</p> : <div className="p-2"><GoogleLogin onSuccess={handleLoginSuccess} shape="pill"/></div>}
                <button onClick={() => setDarkMode(!darkMode)} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3 font-bold dark:text-white text-xs">{darkMode ? <Moon size={18}/> : <Sun size={18}/>} Modo Noche</div>
                  <div className={`w-8 h-4 rounded-full relative ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'left-4.5' : 'left-0.5'}`}></div></div>
                </button>
                {usuario && <button onClick={() => {googleLogout(); setUsuario(null); setVerMenuUsuario(false);}} className="text-red-500 text-xs font-bold p-4 text-left">Cerrar Sesión</button>}
              </div>
            </div>
          </div>
        )}
                {/* POP-UP DE CUPÓN IA */}
        {mostrarCupon && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-[40px] p-8 shadow-2xl border-4 border-blue-500 animate-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl rotate-12">
                  <Sparkles size={40} className="text-white animate-pulse" />
                </div>
                
                <h3 className="text-2xl font-black dark:text-white italic leading-none mb-2">¡IA MATCH!</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">Recompensa por optimizar</p>
                
                <div className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-blue-500 mb-6">
                  <span className="text-2xl font-black tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase">{codigoCupon}</span>
                </div>
                
                <p className="text-[10px] font-black text-slate-400 uppercase mb-8 leading-tight">15% OFF aplicado a tu próximo envío</p>
                
                <button 
                  onClick={() => setMostrarCupon(false)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  ¡Genial, gracias!
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* NAV INFERIOR */}
      <nav className="z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t dark:border-slate-800 p-4 px-8 flex justify-around items-center">
        <button onClick={() => setTabActiva("inicio")} className={`p-2 transition-all ${tabActiva === "inicio" ? "text-blue-600 scale-125" : "text-slate-400"}`}><MapPin size={24}/></button>
        <button onClick={() => setTabActiva("pedidos")} className={`p-2 transition-all ${tabActiva === "pedidos" ? "text-blue-600 scale-125" : "text-slate-400"}`}><Bike size={24}/></button>
        <button onClick={() => setTabActiva("carrito")} className={`p-2 transition-all relative ${tabActiva === "carrito" ? "text-blue-600 scale-125" : "text-slate-400"}`}><ShoppingBag size={24}/>{carrito.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">{carrito.length}</span>}</button>
      </nav>
    </div>
  );
}

export default App;
