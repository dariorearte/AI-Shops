import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ShoppingBag, User, MapPin, Bike, Star, Clock, X, Plus, Minus, 
  Trash2, CreditCard, Banknote, Loader, CheckCircle2, ChevronRight,
  Utensils, Smartphone, Shirt, Pill, ShoppingCart, LogOut, Search, Moon, Sun, Sparkles, LayoutGrid
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
  // --- 1. ESTADOS DE PERSISTENCIA Y NAVEGACIÓN ---
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem('ai_user')) || null);
  const [carrito, setCarrito] = useState(() => JSON.parse(localStorage.getItem('ai_cart')) || []);
  const [historialPedidos, setHistorialPedidos] = useState(() => JSON.parse(localStorage.getItem('ai_history')) || []);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('ai_dark')) ?? true);
  
  // --- NUEVO: CONTROL DE LAS 3 CARAS ---
  const [caraVisible, setCaraVisible] = useState("mapa"); // ecommerce | mapa | social

  // --- ESTADOS DE FLUJO ---
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

  // --- ESTADOS DE IA ---
  const [sugerenciaIA, setSugerenciaIA] = useState(null);
  const [pensandoIA, setPensandoIA] = useState(false);
  const [mostrarCupon, setMostrarCupon] = useState(false);
  const [itemSugeridoIA, setItemSugeridoIA] = useState(null);
  // --- 2. EFECTOS Y PERSISTENCIA ---
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
      setTiendas([
        { 
          id: 1, nombre: "Café AI", cat: "gastronomia", lat: lat + 0.003, lng: lng + 0.003, color: '#EF4444', 
          productos: [
            {id: 101, n: "Espresso Italiano", p: 1200, img: "https://images.unsplash.com"}, 
            {id: 102, n: "Muffin Arándanos", p: 800, img: "https://images.unsplash.com"}
          ] 
        },
        { 
          id: 2, nombre: "Tech Store", cat: "tecnologia", lat: lat - 0.003, lng: lng - 0.003, color: '#3B82F6', 
          productos: [
            {id: 201, n: "Cargador Pro", p: 4500, img: "https://images.unsplash.com"},
            {id: 202, n: "Audífonos In-Ear", p: 8500, img: "https://images.unsplash.com"}
          ] 
        },
      ]);
    });
  }, []);

  // --- 3. FUNCIONES LÓGICAS ---
  const handleLoginSuccess = (res) => {
    const d = jwtDecode(res.credential);
    setUsuario({ nombre: d.given_name, foto: d.picture, email: d.email });
    setVerMenuUsuario(false);
  };

  const agregarAlCarrito = (p, esSugerencia = false) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === p.id);
      if (existe) return prev.map(i => i.id === p.id ? {...i, cant: i.cant + 1} : i);
      return [...prev, {...p, cant: 1, tId: tiendaSeleccionada?.id || 1}];
    });
    if (esSugerencia) { setMostrarCupon(true); setSugerenciaIA(null); setItemSugeridoIA(null); }
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
        setSugerenciaIA("Tu café se siente solo. ¿Agregamos un Muffin?");
        setItemSugeridoIA({id: 102, n: "Muffin Arándanos", p: 800, img: "https://images.unsplash.com"});
      } else { setSugerenciaIA("¡Tu selección es óptima!"); setItemSugeridoIA(null); }
      setPensandoIA(false);
    }, 1200);
  };

  const confirmarPedido = () => {
    setEnCheckout(true);
    setTimeout(() => {
      setEnCheckout(false); setCaraVisible("mapa"); setRastreando(true);
      const tOrigen = tiendas.find(t => t.id === 1) || tiendas[0];
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
    const totalFinal = carrito.reduce((acc, i) => acc + (i.p * i.cant), 0);
    const nuevoPedido = { usuario_email: usuario?.email || 'anonimo@aishops.com', tienda_nombre: "AI Shop", total: totalFinal, items: carrito, fecha: new Date().toISOString() };
    try { await supabase.from('pedidos').insert([nuevoPedido]); } catch (err) { console.error(err); }
    setHistorialPedidos(prev => [{id: 'AI-'+Math.random().toString(36).substr(2,4).toUpperCase(), ...nuevoPedido}, ...prev]);
    setRastreando(false); setPedidoEntregado(false); setCarrito([]); setCaraVisible("pedidos");
  };

  // --- 4. RENDER PRINCIPAL ---
  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-all duration-500">
      
      {/* HEADER */}
      <header className="z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b dark:border-slate-800 p-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setCaraVisible("mapa"); setVerMenu(false);}}>
          <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center font-black text-white dark:text-slate-900 shadow-lg">AI</div>
          <h1 className="text-xl font-black italic dark:text-white tracking-tighter leading-none">Shops</h1>
        </div>
        <button onClick={() => setVerMenuUsuario(!verMenuUsuario)} className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border dark:border-slate-700 active:scale-90 transition-all shadow-sm">
          {usuario ? <img src={usuario.foto} className="w-full h-full object-cover"/> : <User size={20} className="dark:text-white"/>}
        </button>
      </header>
      <main className="flex-1 relative z-0 flex flex-col overflow-hidden">
        
        {/* --- CARA 1: E-COMMERCE (INDUCCIÓN VISUAL) --- */}
        <div className={`absolute inset-0 z-20 bg-slate-50 dark:bg-slate-950 transition-all duration-500 ease-in-out transform ${caraVisible === 'ecommerce' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
          <div className="p-6 h-full overflow-y-auto pb-32">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black italic dark:text-white tracking-tighter uppercase leading-none">Flash<br/><span className="text-blue-600">Deals</span></h2>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm"><Search size={20} className="text-slate-400"/></div>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {tiendas.flatMap(t => t.productos).map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border dark:border-slate-800 group active:scale-95 transition-all duration-300">
                  <div className="relative h-64">
                    <img src={p.img} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest dark:text-white">Nuevo</div>
                  </div>
                  <div className="p-8 text-left">
                    <h3 className="font-black text-2xl dark:text-white leading-tight mb-2 uppercase italic">{p.n}</h3>
                    <div className="flex justify-between items-end">
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Precio IA</p><p className="font-black text-3xl dark:text-white tracking-tighter">$ {p.p}</p></div>
                      <button onClick={() => {setVerMenu(true); setTiendaSeleccionada(tiendas[0]);}} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Comprar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- CARA 2: MAPA (EXPLORACIÓN CENTRAL) --- */}
        <div className={`absolute inset-0 z-0 transition-all duration-700 ${caraVisible === 'mapa' ? 'scale-100 opacity-100' : 'scale-110 opacity-30 blur-md pointer-events-none'}`}>
          {position && (
            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <RecenterMap position={position} />
              <Marker position={position} icon={L.divIcon({ html: `<div class="w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-2xl animate-pulse"></div>` })} />
              {tiendas.map(t => (
                <Marker key={t.id} position={[t.lat, t.lng]} eventHandlers={{ click: () => setTiendaSeleccionada(t) }}
                  icon={L.divIcon({ html: `<div class="w-12 h-12 rounded-[20px] border-2 border-white shadow-2xl flex items-center justify-center text-white" style="background-color: ${t.color}"><MapPin size={22}/></div>` })}
                />
              ))}
              {rastreando && motoPos && <Marker position={motoPos} icon={L.divIcon({ html: `<div class="bg-blue-600 p-3 rounded-full border-2 border-white shadow-2xl text-white animate-bounce"><Bike size={24}/></div>` })} />}
            </MapContainer>
          )}
          {rastreando && (
            <div className="absolute top-6 left-6 right-6 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-[32px] shadow-2xl border dark:border-slate-800 flex items-center gap-4 animate-in slide-in-from-top-10">
              <div className={`p-4 rounded-2xl text-white ${pedidoEntregado ? 'bg-green-500' : 'bg-blue-600'} shadow-lg`}>{pedidoEntregado ? <CheckCircle2 size={24}/> : <Bike size={24}/>}</div>
              <div className="flex-1 text-left"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rastreo IA</p><p className="font-bold dark:text-white leading-tight">{pedidoEntregado ? "¡Tu pedido llegó!" : "Repartidor en camino"}</p></div>
              {pedidoEntregado && <button onClick={finalizarPedidoYLimpiar} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white"><X size={20}/></button>}
            </div>
          )}
          {tiendaSeleccionada && !rastreando && caraVisible === 'mapa' && (
            <div className="absolute bottom-10 left-6 right-6 z-50 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-6 border dark:border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-10">
              <div className="text-left"><h2 className="font-black text-2xl dark:text-white leading-none tracking-tighter uppercase italic">{tiendaSeleccionada.nombre}</h2><p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">A 5 min de ti</p></div>
              <div className="flex gap-2"><button onClick={() => setTiendaSeleccionada(null)} className="p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl dark:text-white"><X size={20}/></button><button onClick={() => setVerMenu(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Abrir</button></div>
            </div>
          )}
        </div>

        {/* --- CARA 3: MARKETPLACE (COMUNIDAD) --- */}
        <div className={`absolute inset-0 z-20 bg-slate-50 dark:bg-slate-950 transition-all duration-500 transform ${caraVisible === 'social' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
          <div className="p-6 h-full overflow-y-auto pb-32">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black italic dark:text-white tracking-tighter uppercase leading-none">Market<br/><span className="text-blue-600">Place</span></h2>
              <button className="bg-blue-600 text-white p-4 rounded-[20px] shadow-xl active:scale-90 transition-all"><Plus size={24}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border dark:border-slate-800 shadow-sm active:scale-95 transition-all">
                  <div className="h-40 bg-slate-100 dark:bg-slate-800 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10"><LayoutGrid size={48}/></div>
                  </div>
                  <div className="p-5 text-left">
                    <p className="font-black text-lg dark:text-white leading-none">$ 4.500</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-tighter">Iphone Usado • 2km</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANTALLA HISTORIAL (SOLO CUANDO SE ACTIVA) */}
        {caraVisible === "pedidos" && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-slate-950 p-8 overflow-y-auto animate-in fade-in">
             <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black dark:text-white italic uppercase tracking-tighter">Tus Pedidos</h2><button onClick={() => setCaraVisible("mapa")} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl dark:text-white"><X size={20}/></button></div>
             {historialPedidos.map(p => (
               <div key={p.id} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[32px] mb-4 flex justify-between border dark:border-slate-800 shadow-sm">
                 <div className="text-left"><p className="font-black dark:text-white uppercase italic">{p.tienda_nombre}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{p.fecha.split('T')[0]} • ${p.total}</p></div>
                 <CheckCircle2 className="text-green-500" size={24}/>
               </div>
             ))}
          </div>
        )}

        {/* MODAL MENU TIENDA */}
        {verMenu && tiendaSeleccionada && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end">
            <div className="bg-white dark:bg-slate-900 w-full rounded-t-[50px] p-10 animate-in slide-in-from-bottom-full max-h-[90vh] overflow-y-auto border-t dark:border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black dark:text-white italic tracking-tighter uppercase">{tiendaSeleccionada.nombre}</h2><button onClick={() => setVerMenu(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full dark:text-white"><X size={24}/></button></div>
              <div className="space-y-6 mb-12">{tiendaSeleccionada.productos.map(p => {
                const cant = carrito.find(i => i.id === p.id)?.cant || 0;
                return (
                  <div key={p.id} className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border dark:border-slate-800 transition-all">
                    <img src={p.img} className="w-20 h-20 rounded-[20px] object-cover shadow-lg" />
                    <div className="flex-1 text-left"><p className="font-black dark:text-white text-md uppercase leading-tight mb-2 italic">{p.n}</p><p className="font-black text-lg text-blue-600 dark:text-blue-400">$ {p.p}</p></div>
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl border dark:border-slate-700">
                      <button onClick={() => quitarDelCarrito(p.id)} className="p-2 text-red-500 active:scale-50 transition-all"><Minus size={20}/></button>
                      <span className="font-black text-lg dark:text-white w-6 text-center">{cant}</span>
                      <button onClick={() => agregarAlCarrito(p)} className="p-2 text-green-500 active:scale-50 transition-all"><Plus size={20}/></button>
                    </div>
                  </div>
                );
              })}</div>
              <button onClick={() => {setVerMenu(false); setCaraVisible("carrito");}} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-3xl shadow-2xl uppercase tracking-[0.2em] text-xs">Pagar Bolsa ({carrito.length})</button>
            </div>
          </div>
        )}

        {/* CARRITO / BOLSA */}
        {caraVisible === "carrito" && (
          <div className="absolute inset-0 z-[60] bg-white dark:bg-slate-950 p-8 overflow-y-auto animate-in slide-in-from-right-20">
            <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black dark:text-white italic uppercase tracking-tighter">Mi Bolsa</h2><button onClick={() => setCaraVisible("mapa")} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl dark:text-white"><X size={20}/></button></div>
            {carrito.length === 0 ? <p className="text-center opacity-10 py-32 font-black text-4xl uppercase italic">Vacia</p> : (
              <div className="flex flex-col gap-8">
                {/* AI ENGINE */}
                <div className="p-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                  <Sparkles className="absolute -right-4 -top-4 opacity-20 group-hover:scale-150 transition-transform duration-700" size={100}/>
                  <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Star size={16}/> AI Engine</div><button onClick={consultarIA} disabled={pensandoIA} className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black backdrop-blur-md uppercase">{pensandoIA ? "Thinking..." : "Optimize"}</button></div>
                  {sugerenciaIA && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <p className="text-lg font-black italic mb-6 leading-tight">"{sugerenciaIA}"</p>
                      {itemSugeridoIA && <button onClick={() => agregarAlCarrito(itemSugeridoIA, true)} className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">Add {itemSugeridoIA.n}</button>}
                    </div>
                  )}
                </div>
                {carrito.map(i => (
                  <div key={i.id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900 rounded-[32px] border dark:border-slate-800"><div className="flex items-center gap-4 text-left"><img src={i.img} className="w-16 h-16 rounded-[20px] object-cover" /><p className="font-black dark:text-white text-sm uppercase italic">{i.cant}x {i.n}</p></div><p className="font-black dark:text-white text-lg tracking-tighter">$ {i.p * i.cant}</p></div>
                ))}
                <button onClick={confirmarPedido} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-[30px] shadow-2xl text-lg flex items-center justify-center gap-3 uppercase tracking-widest">Confirmar & Pagar</button>
              </div>
            )}
          </div>
        )}

        {/* POP-UP CUPÓN IA */}
        {mostrarCupon && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[50px] p-10 shadow-2xl border-4 border-blue-600 relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-[30px] flex items-center justify-center mb-8 shadow-2xl rotate-12 animate-bounce"><Sparkles size={48} className="text-white"/></div>
                <h3 className="text-4xl font-black dark:text-white italic tracking-tighter leading-none mb-2 uppercase">IA Match!</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Special Reward</p>
                <div className="w-full py-5 bg-slate-100 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-blue-500 mb-8"><span className="text-3xl font-black tracking-[0.3em] text-blue-600 dark:text-blue-400 uppercase">AISHOP15</span></div>
                <button onClick={() => setMostrarCupon(false)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-2xl uppercase text-[10px] tracking-[0.2em]">Claim Reward</button>
              </div>
            </div>
          </div>
        )}

        {/* MENU USUARIO */}
        {verMenuUsuario && (
          <div className="fixed inset-0 z-[100] flex justify-end p-6 bg-black/40 backdrop-blur-sm" onClick={() => setVerMenuUsuario(false)}>
            <div className="w-72 h-fit bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-6 animate-in slide-in-from-right-10" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center gap-4 border dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white">{usuario ? <img src={usuario.foto} className="w-full h-full object-cover"/> : <User className="p-3"/>}</div>
                  <div className="text-left leading-none"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">User Account</p><p className="font-black dark:text-white uppercase italic">{usuario?.nombre || "Guest"}</p></div>
                </div>
                {!usuario && <div className="p-2"><GoogleLogin onSuccess={handleLoginSuccess} shape="pill"/></div>}
                <button onClick={() => setDarkMode(!darkMode)} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl transition-all border dark:border-slate-700"><div className="flex items-center gap-3">{darkMode ? <Moon size={20} className="text-blue-400"/> : <Sun size={20} className="text-yellow-500"/>}<span className="text-xs font-black dark:text-white uppercase tracking-widest">Night Mode</span></div><div className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'left-6' : 'left-1'}`}></div></div></button>
                <button onClick={() => setCaraVisible("pedidos")} className="flex items-center gap-3 p-5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-xs font-black dark:text-white uppercase tracking-widest transition-all"><Bike size={20} className="text-slate-400"/> My Orders</button>
                {usuario && <button onClick={() => {googleLogout(); setUsuario(null); setVerMenuUsuario(false);}} className="text-red-500 text-[10px] font-black uppercase p-5 border-t dark:border-slate-800 text-center tracking-widest mt-2">Log Out System</button>}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- NAV INFERIOR (CONTROLA LAS 3 CARAS) --- */}
      <nav className="z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t dark:border-slate-800 p-6 px-10 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => {setCaraVisible("ecommerce"); setVerMenu(false);}} className={`p-3 transition-all duration-500 ${caraVisible === 'ecommerce' ? "text-blue-600 scale-125 bg-blue-50 dark:bg-blue-900/20 rounded-[20px]" : "text-slate-400 hover:text-slate-600"}`}>
          <LayoutGrid size={28}/>
        </button>
        <button onClick={() => {setCaraVisible("mapa"); setVerMenu(false);}} className={`p-4 transition-all duration-500 transform ${caraVisible === 'mapa' ? "text-white scale-110 bg-slate-900 dark:bg-white dark:text-slate-900 rounded-[24px] shadow-2xl -translate-y-4" : "text-slate-400 hover:text-slate-600"}`}>
          <MapPin size={32}/>
        </button>
        <button onClick={() => {setCaraVisible("social"); setVerMenu(false);}} className={`p-3 transition-all duration-500 ${caraVisible === 'social' ? "text-blue-600 scale-125 bg-blue-50 dark:bg-blue-900/20 rounded-[20px]" : "text-slate-400 hover:text-slate-600"}`}>
          <ShoppingCart size={28}/>
        </button>
      </nav>
    </div>
  );
}

export default App;
