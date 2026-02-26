import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ShoppingBag, User, MapPin, Bike, Star, Clock, X, Plus, Minus, 
  Trash2, CreditCard, Banknote, Loader, CheckCircle2, ChevronRight,
  Utensils, Smartphone, Shirt, Pill, ShoppingCart, LogOut, Search, Moon, Sun, Sparkles, LayoutGrid, Camera
} from 'lucide-react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { supabase } from './supabaseClient';

// --- CONFIGURACIÓN DE ICONOS LEAFLET (FIX) ---
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
      setTimeout(() => map.invalidateSize(), 500); 
    } 
  }, [position, map]);
  return null;
}

function App() {
  // --- 1. ESTADOS DE PERSISTENCIA Y NAVEGACIÓN ---
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem('ai_user')) || null);
  const [carrito, setCarrito] = useState(() => JSON.parse(localStorage.getItem('ai_cart')) || []);
  const [historialPedidos, setHistorialPedidos] = useState(() => JSON.parse(localStorage.getItem('ai_history')) || []);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('ai_dark')) ?? true);
  const [caraVisible, setCaraVisible] = useState("mapa"); 
  
  // --- 2. ESTADOS DE FLUJO ---
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
  const [mostrarCupon, setMostrarCupon] = useState(false);
  const [itemSugeridoIA, setItemSugeridoIA] = useState(null);

  useEffect(() => {
    localStorage.setItem('ai_user', JSON.stringify(usuario));
    localStorage.setItem('ai_cart', JSON.stringify(carrito));
    localStorage.setItem('ai_history', JSON.stringify(historialPedidos));
    localStorage.setItem('ai_dark', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [usuario, carrito, historialPedidos, darkMode]);
  // --- 4. GEOLOCALIZACIÓN Y TIENDAS ---
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setPosition([lat, lng]);
      setTiendas([
        { 
          id: 1, nombre: "Café AI", cat: "gastronomia", lat: lat + 0.003, lng: lng + 0.003, color: '#EF4444', 
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
        },
      ]);
    });
  }, []);

  // --- 5. FUNCIONES LÓGICAS (RECONSTRUIDAS) ---
  const handleLoginSuccess = (res) => {
    const d = jwtDecode(res.credential);
    const datosUser = { nombre: d.given_name, foto: d.picture, email: d.email };
    setUsuario(datosUser);
    setVerMenuUsuario(false);
  };

  const agregarAlCarrito = (p, esIA = false) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === p.id);
      if (existe) return prev.map(i => i.id === p.id ? {...i, cant: i.cant + 1} : i);
      return [...prev, {...p, cant: 1, tId: tiendaSeleccionada?.id || 1}];
    });
    if (esIA) { setMostrarCupon(true); setSugerenciaIA(null); setItemSugeridoIA(null); }
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
        setSugerenciaIA("Tu Espresso se siente solo. ¿Sumamos un Muffin?");
        setItemSugeridoIA({id: 102, n: "Muffin Arándanos", p: 800, img: "https://images.unsplash.com"});
      } else { setSugerenciaIA("¡Tu selección es perfecta!"); setItemSugeridoIA(null); }
      setPensandoIA(false);
    }, 1200);
  };

  const confirmarPedido = () => {
    setEnCheckout(true);
    setTimeout(() => {
      setEnCheckout(false); setCaraVisible("mapa"); setRastreando(true);
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
    const total = carrito.reduce((acc, i) => acc + (i.p * i.cant), 0);
    const pedido = { usuario_email: usuario?.email || 'anon@ai.com', total, items: carrito, fecha: new Date().toISOString() };
    try { await supabase.from('pedidos').insert([pedido]); } catch (err) { console.error(err); }
    setHistorialPedidos(prev => [pedido, ...prev]);
    setRastreando(false); setPedidoEntregado(false); setCarrito([]); setCaraVisible("pedidos");
  };
  // --- 6. RENDERIZADO DE INTERFAZ ---
  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* HEADER ULTRA-PREMIUM GLASS */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-between items-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl border-b border-white/20 dark:border-white/5">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => {setCaraVisible("mapa"); setVerMenu(false);}}>
          <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-[22px] flex items-center justify-center font-black text-white dark:text-slate-900 shadow-2xl transition-transform active:scale-90">AI</div>
          <div className="flex flex-col leading-none text-left">
            <h1 className="text-2xl font-black italic dark:text-white tracking-tighter uppercase">Shops</h1>
            <span className="text-[9px] font-black text-blue-600 tracking-[0.2em] uppercase">Intelligence</span>
          </div>
        </div>
        <button onClick={() => setVerMenuUsuario(!verMenuUsuario)} className="w-12 h-12 bg-white/80 dark:bg-slate-800 rounded-[22px] overflow-hidden border-2 border-white dark:border-slate-700 shadow-xl active:scale-90 transition-all">
          {usuario ? <img src={usuario.foto} className="w-full h-full object-cover"/> : <User className="mx-auto mt-3 dark:text-white"/>}
        </button>
      </header>

      <main className="flex-1 relative mt-[80px] overflow-hidden">
        
        {/* --- CARA 1: E-COMMERCE (DISEÑO INDUCTIVO) --- */}
        <div className={`absolute inset-0 z-30 bg-slate-50 dark:bg-slate-950 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform ${caraVisible === 'ecommerce' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
          <div className="p-8 h-full overflow-y-auto pb-40">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-5xl font-black italic dark:text-white tracking-tighter uppercase text-left leading-[0.85]">AI<br/><span className="text-blue-600">DEALS</span></h2>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-[25px] shadow-xl border dark:border-slate-800"><Search size={24} className="text-slate-400"/></div>
             </div>
             <div className="grid grid-cols-1 gap-10">
               {tiendas.flatMap(t => t.productos).map(p => (
                 <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[50px] overflow-hidden shadow-2xl border dark:border-slate-800 group active:scale-95 transition-all">
                    <img src={p.img} className="w-full h-80 object-cover" alt={p.n} />
                    <div className="p-10 text-left">
                       <h3 className="font-black text-3xl dark:text-white italic uppercase mb-4">{p.n}</h3>
                       <div className="flex justify-between items-center">
                          <span className="font-black text-4xl dark:text-white tracking-tighter">$ {p.p}</span>
                          <button onClick={() => {setTiendaSeleccionada(tiendas[0]); setVerMenu(true);}} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-3xl font-black uppercase text-[12px] tracking-widest shadow-2xl">Añadir</button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* --- CARA 2: MAPA (CENTRAL) --- */}
        <div className={`absolute inset-0 z-10 transition-all duration-1000 ${caraVisible === 'mapa' ? 'scale-100 opacity-100' : 'scale-125 blur-3xl opacity-20 pointer-events-none'}`}>
          {position && (
            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <RecenterMap position={position} />
              <Marker position={position} icon={L.divIcon({ html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-2xl animate-pulse"></div>` })} />
              {tiendas.map(t => (
                <Marker key={t.id} position={[t.lat, t.lng]} eventHandlers={{ click: () => setTiendaSeleccionada(t) }}
                  icon={L.divIcon({ html: `<div class="w-14 h-14 rounded-[25px] border-4 border-white shadow-2xl flex items-center justify-center text-white" style="background-color: ${t.color}"><MapPin size={24}/></div>` })}
                />
              ))}
              {rastreando && motoPos && <Marker position={motoPos} icon={L.divIcon({ html: `<div class="bg-blue-600 p-3 rounded-full border-4 border-white shadow-2xl text-white animate-bounce"><Bike size={28}/></div>` })} />}
            </MapContainer>
          )}
        </div>
        {/* --- CARA 3: MARKETPLACE (COMUNIDAD) --- */}
        <div className={`absolute inset-0 z-30 bg-slate-50 dark:bg-slate-950 transition-all duration-700 ease-out transform ${caraVisible === 'social' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
           <div className="p-8 h-full overflow-y-auto pb-40">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-5xl font-black italic dark:text-white tracking-tighter uppercase text-left leading-[0.85]">COMMU<br/><span className="text-blue-600">NITY</span></h2>
                 <button className="bg-blue-600 text-white p-5 rounded-[28px] shadow-2xl active:scale-90 transition-all"><Camera size={28}/></button>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-[35px] overflow-hidden border dark:border-slate-800 shadow-xl group active:scale-95 transition-all">
                    <div className="h-48 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center opacity-30">
                       <ShoppingCart size={40}/>
                    </div>
                    <div className="p-6 text-left">
                       <p className="font-black text-2xl dark:text-white leading-none mb-1">$ {i * 2500}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Articulo • {i}km cerca</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* MODAL MENU TIENDA */}
        {verMenu && tiendaSeleccionada && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-end">
            <div className="bg-white dark:bg-slate-900 w-full rounded-t-[60px] p-10 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full border-t dark:border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black dark:text-white italic uppercase tracking-tighter leading-none">Menú</h2><button onClick={() => setVerMenu(false)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full dark:text-white"><X size={24}/></button></div>
              <div className="space-y-6 mb-12">{(tiendaSeleccionada.productos || tiendas[0].productos).map(p => {
                const cant = carrito.find(i => i.id === p.id)?.cant || 0;
                return (
                  <div key={p.id} className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[35px] border dark:border-slate-800 shadow-sm">
                    <img src={p.img} className="w-24 h-24 rounded-[25px] object-cover shadow-xl" />
                    <div className="flex-1 text-left"><p className="font-black dark:text-white text-lg uppercase italic leading-none mb-2">{p.n}</p><p className="font-black text-xl text-blue-600 dark:text-blue-400">$ {p.p}</p></div>
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border dark:border-slate-700 shadow-xl">
                      <button onClick={() => quitarDelCarrito(p.id)} className="p-2 text-red-500"><Minus size={20}/></button>
                      <span className="font-black text-xl dark:text-white w-6 text-center">{cant}</span>
                      <button onClick={() => agregarAlCarrito(p)} className="p-2 text-green-600"><Plus size={20}/></button>
                    </div>
                  </div>
                )})}</div>
              <button onClick={() => {setVerMenu(false); setCaraVisible("carrito");}} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-[30px] uppercase tracking-[0.2em] text-xs shadow-2xl">Revisar Bolsa ({carrito.length})</button>
            </div>
          </div>
        )}

        {/* CARRITO / BOLSA */}
        {caraVisible === "carrito" && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-slate-950 p-8 overflow-y-auto animate-in slide-in-from-right-20">
            <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black dark:text-white italic uppercase tracking-tighter">Bolsa</h2><button onClick={() => setCaraVisible("mapa")} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl dark:text-white"><X size={20}/></button></div>
            {carrito.length === 0 ? <p className="text-center opacity-10 py-32 font-black text-4xl uppercase italic">Vacia</p> : (
              <div className="flex flex-col gap-8">
                <div className="p-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Star size={16}/> AI Engine</div><button onClick={consultarIA} disabled={pensandoIA} className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black backdrop-blur-md uppercase">{pensandoIA ? "Procesando..." : "Optimizar"}</button></div>
                  {sugerenciaIA && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <p className="text-lg font-black italic mb-6 leading-tight">"{sugerenciaIA}"</p>
                      {itemSugeridoIA && <button onClick={() => agregarAlCarrito(itemSugeridoIA, true)} className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">Sumar {itemSugeridoIA.n}</button>}
                    </div>
                  )}
                </div>
                {carrito.map(i => (
                  <div key={i.id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900 rounded-[32px] border dark:border-slate-800"><div className="flex items-center gap-4 text-left"><img src={i.img} className="w-16 h-16 rounded-[20px] object-cover" /><p className="font-black dark:text-white text-sm uppercase italic">{i.cant}x {i.n}</p></div><p className="font-black dark:text-white text-lg tracking-tighter">$ {i.p * i.cant}</p></div>
                ))}
                <button onClick={confirmarPedido} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-[30px] shadow-2xl text-lg flex items-center justify-center gap-3 uppercase tracking-widest">
                  {enCheckout ? <Loader className="animate-spin" size={24}/> : "Confirmar Compra"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* NAV INFERIOR PREMIUM */}
      <nav className="fixed bottom-8 left-8 right-8 z-50 h-24 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[40px] border border-white/20 dark:border-white/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex justify-around items-center px-6">
        <button onClick={() => setCaraVisible("ecommerce")} className={`p-5 rounded-[28px] transition-all duration-500 ${caraVisible === 'ecommerce' ? "bg-blue-600 text-white shadow-2xl scale-110" : "text-slate-400 opacity-50"}`}>
          <LayoutGrid size={28} strokeWidth={2.5}/>
        </button>
        <button onClick={() => setCaraVisible("mapa")} className={`p-6 rounded-[30px] transition-all duration-500 transform ${caraVisible === 'mapa' ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-125 -translate-y-4" : "text-slate-400 opacity-50"}`}>
          <MapPin size={32} strokeWidth={2.5}/>
        </button>
        <button onClick={() => setCaraVisible("social")} className={`p-5 rounded-[28px] transition-all duration-500 ${caraVisible === 'social' ? "bg-blue-600 text-white shadow-2xl scale-110" : "text-slate-400 opacity-50"}`}>
          <ShoppingCart size={28} strokeWidth={2.5}/>
        </button>
      </nav>

      {/* POP-UP CUPÓN IA */}
      {mostrarCupon && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[50px] p-10 shadow-2xl border-4 border-blue-600 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-[30px] flex items-center justify-center mb-8 shadow-2xl rotate-12 animate-bounce"><Sparkles size={48} className="text-white"/></div>
              <h3 className="text-4xl font-black dark:text-white italic tracking-tighter mb-8 uppercase leading-none">IA Match!</h3>
              <div className="w-full py-5 bg-slate-100 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-blue-500 mb-8"><span className="text-3xl font-black text-blue-600 uppercase tracking-widest">AISHOP15</span></div>
              <button onClick={() => setMostrarCupon(false)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-2xl uppercase text-[10px]">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
