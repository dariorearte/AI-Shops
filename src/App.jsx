import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ShoppingBag, User, MapPin, Bike, Star, Clock, X, Plus, Minus, 
  Trash2, CreditCard, Banknote, Loader, CheckCircle2, ChevronRight,
  Utensils, Smartphone, Shirt, Pill, ShoppingCart
} from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';

// --- FIX ICONOS LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com',
  iconUrl: 'https://unpkg.com',
  shadowUrl: 'https://unpkg.com',
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) { map.setView(position, 15); map.invalidateSize(); } }, [position, map]);
  return null;
}

function App() {
  const [tabActiva, setTabActiva] = useState("inicio");
  const [position, setPosition] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [verMenu, setVerMenu] = useState(false);
  const [verMenuUsuario, setVerMenuUsuario] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [enCheckout, setEnCheckout] = useState(false);
  const [rastreando, setRastreando] = useState(false);
  const [motoPos, setMotoPos] = useState(null);
  const [pedidoEntregado, setPedidoEntregado] = useState(false);
  const [historialPedidos, setHistorialPedidos] = useState([]);

  const categorias = [
    { id: 'gastronomia', nombre: 'Food', icon: <Utensils size={22}/>, color: '#EF4444' },
    { id: 'tecnologia', nombre: 'Tech', icon: <Smartphone size={22}/>, color: '#3B82F6' },
    { id: 'moda', nombre: 'Style', icon: <Shirt size={22}/>, color: '#8B5CF6' },
    { id: 'salud', nombre: 'Health', icon: <Pill size={22}/>, color: '#10B981' },
    { id: 'market', nombre: 'Market', icon: <ShoppingCart size={22}/>, color: '#F59E0B' },
  ];

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude; const lng = pos.coords.longitude;
      setPosition([lat, lng]);
      setTiendas([
        { id: 1, nombre: "Café AI", cat: "gastronomia", lat: lat + 0.003, lng: lng + 0.003, color: '#EF4444', productos: [{id: 101, n: "Espresso", p: 1200}, {id: 102, n: "Muffin", p: 800}] },
        { id: 2, nombre: "Tech Store", cat: "tecnologia", lat: lat - 0.003, lng: lng - 0.003, color: '#3B82F6', productos: [{id: 201, n: "Cargador C", p: 4500}] },
      ]);
    });
  }, []);

  const agregarAlCarrito = (p) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === p.id);
      if (existe) return prev.map(i => i.id === p.id ? {...i, cant: i.cant + 1} : i);
      return [...prev, {...p, cant: 1}];
    });
  };

  const quitarDelCarrito = (id) => {
    setCarrito(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.cant > 1) return prev.map(i => i.id === id ? {...i, cant: i.cant - 1} : i);
      return prev.filter(i => i.id !== id);
    });
  };

  const total = carrito.reduce((acc, i) => acc + (i.p * i.cant), 0);

  const confirmarPedido = () => {
    setEnCheckout(true);
    const tOrigen = tiendas.find(t => t.id === (carrito[0]?.tId || 1)) || tiendas[0];
    setTimeout(() => {
      setEnCheckout(false); setTabActiva("inicio"); setRastreando(true);
      setMotoPos([tOrigen.lat, tOrigen.lng]);
      let t = 0;
      const interval = setInterval(() => {
        t += 0.1; 
        if (t >= 1) { clearInterval(interval); setMotoPos(position); setPedidoEntregado(true); }
        else { setMotoPos([tOrigen.lat + (position[0] - tOrigen.lat) * t, tOrigen.lng + (position[1] - tOrigen.lng) * t]); }
      }, 1000);
    }, 1500);
  };

  const finalizarPedidoYLimpiar = () => {
    const nuevo = { id: 'AI-'+Math.random().toString(36).substr(2,4).toUpperCase(), tienda: tiendaSeleccionada?.nombre || "AI Shop", total, fecha: "Hoy", estado: "Entregado" };
    setHistorialPedidos([nuevo, ...historialPedidos]);
    setRastreando(false); setPedidoEntregado(false); setCarrito([]); setMotoPos(null); setTiendaSeleccionada(null); setTabActiva("pedidos");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans antialiased">
      
      {/* HEADER: LOGO = INICIO */}
      <header className="z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b p-4 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer active:scale-95 transition-all" onClick={() => {setTabActiva("inicio"); setCategoriaSeleccionada(null); setTiendaSeleccionada(null);}}>
          <div className="w-11 h-11 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center font-black text-xl text-white dark:text-slate-900 shadow-lg tracking-tighter">AI</div>
          <h1 className="text-2xl font-black italic text-slate-800 dark:text-white tracking-tighter leading-none">Shops</h1>
        </div>
        <div className="relative">
          <button onClick={() => setVerMenuUsuario(!verMenuUsuario)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 text-slate-900 dark:text-white active:scale-90 transition-all shadow-sm">
            <User size={22}/>
          </button>
          {verMenuUsuario && (
            <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border dark:border-slate-800 p-2 z-50 animate-in slide-in-from-top-2">
              <button onClick={() => {setTabActiva("pedidos"); setVerMenuUsuario(false);}} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                <Bike size={20} className="text-slate-400"/><span className="text-[10px] font-black uppercase dark:text-white tracking-widest">Mis Pedidos</span>
              </button>
              <button onClick={() => {setTabActiva("carrito"); setVerMenuUsuario(false);}} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                <div className="flex items-center gap-3"><ShoppingBag size={20} className="text-slate-400"/><span className="text-[10px] font-black uppercase dark:text-white tracking-widest">Carrito</span></div>
                {carrito.length > 0 && <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-black">{carrito.length}</span>}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 relative z-0">
        {/* VISTA INICIO / MAPA */}
        {tabActiva === "inicio" && (
          <div className="h-full w-full relative">
            {position && (
              <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <RecenterMap position={position} />
                <Marker position={position} icon={L.divIcon({ html: `<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>` })} />
                {tiendas.filter(t => !categoriaSeleccionada || t.cat === categoriaSeleccionada.id).map(t => (
                  <Marker key={t.id} position={[t.lat, t.lng]} eventHandlers={{ click: () => setTiendaSeleccionada(t) }}
                    icon={L.divIcon({ html: `<div class="w-10 h-10 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center text-white" style="background-color: ${t.color}"><MapPin size={18}/></div>` })}
                  />
                ))}
                {rastreando && motoPos && <Marker position={motoPos} icon={L.divIcon({ html: `<div class="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg text-white animate-bounce"><Bike size={18}/></div>` })} />}
              </MapContainer>
            )}

            {/* TRACKER FLOTANTE */}
            {rastreando && (
              <div className="absolute top-4 left-4 right-4 z-40 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl border dark:border-slate-800 flex items-center gap-4 animate-in slide-in-from-top-4">
                <div className={`p-3 rounded-2xl text-white ${pedidoEntregado ? 'bg-green-500' : 'bg-blue-600'}`}>{pedidoEntregado ? <CheckCircle2 size={24}/> : <Bike size={24}/>}</div>
                <div className="flex-1"><p className="font-black text-[10px] uppercase text-slate-400">Rastreo</p><p className="text-sm font-bold dark:text-white leading-tight">{pedidoEntregado ? "¡Tu pedido llegó!" : "El repartidor va hacia ti"}</p></div>
                {pedidoEntregado && <button onClick={finalizarPedidoYLimpiar} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl active:scale-75 transition-all"><X size={20}/></button>}
              </div>
            )}

            {/* CARD TIENDA */}
            {tiendaSeleccionada && !rastreando && (
              <div className="absolute bottom-36 left-4 right-4 z-40 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-5 border dark:border-slate-800 flex items-center gap-4 animate-in slide-in-from-bottom-10 transition-all">
                <div className="flex-1"><h2 className="font-black text-xl dark:text-white leading-none tracking-tight">{tiendaSeleccionada.nombre}</h2><p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Explorar Tienda</p></div>
                <button onClick={() => setVerMenu(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg">Abrir</button>
              </div>
            )}
          </div>
        )}

        {/* VISTA HISTORIAL (PEDIDOS) */}
        {tabActiva === "pedidos" && (
          <div className="p-8 h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto pb-24 relative animate-in fade-in">
            <button onClick={() => setTabActiva("inicio")} className="absolute top-8 right-8 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border text-slate-900 dark:text-white active:scale-90 transition-all z-10"><X size={20}/></button>
            <h2 className="text-4xl font-black italic mb-8 dark:text-white tracking-tighter">Historial</h2>
            <div className="space-y-4">
              {historialPedidos.length === 0 ? <p className="text-center opacity-20 font-black uppercase py-20">Sin registros</p> : historialPedidos.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border dark:border-slate-800 flex items-center justify-between shadow-sm">
                  <div><h3 className="font-black dark:text-white leading-none">{p.tienda}</h3><p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{p.fecha} • ${p.total}</p></div>
                  <div className="text-green-500"><CheckCircle2 size={20}/></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA CHECKOUT (CARRITO) */}
        {tabActiva === "carrito" && (
          <div className="p-8 h-full bg-white dark:bg-slate-950 overflow-y-auto pb-32 relative animate-in slide-in-from-right-5">
            <button onClick={() => setTabActiva("inicio")} className="absolute top-8 right-8 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-slate-900 dark:text-white active:scale-90 transition-all z-10"><X size={20}/></button>
            <h2 className="text-4xl font-black italic mb-8 dark:text-white tracking-tighter uppercase">Checkout</h2>
            {carrito.length === 0 ? <p className="text-center opacity-20 font-black uppercase py-20 text-2xl">Vacío</p> : (
              <div className="animate-in fade-in">
                <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-900 rounded-[28px] border border-dashed flex items-center gap-3">
                  <MapPin size={20} className="text-blue-600"/><p className="text-xs font-bold dark:text-white italic">Entregar en mi ubicación actual</p>
                </div>
                <div className="space-y-3 mb-8">{carrito.map(i => (
                  <div key={i.id} className="flex justify-between items-center p-4 border rounded-2xl dark:border-slate-800 shadow-sm"><p className="font-bold text-sm dark:text-white">{i.cant}x {i.n}</p><p className="font-black text-sm dark:text-white">$ {i.p * i.cant}</p></div>
                ))}</div>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <button onClick={() => setMetodoPago('efectivo')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPago === 'efectivo' ? 'border-slate-900 bg-slate-50' : 'opacity-40 border-slate-100'}`}><Banknote size={20}/><span className="text-[10px] font-black uppercase">Efectivo</span></button>
                  <button onClick={() => setMetodoPago('tarjeta')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPago === 'tarjeta' ? 'border-slate-900 bg-slate-50' : 'opacity-40 border-slate-100'}`}><CreditCard size={20}/><span className="text-[10px] font-black uppercase">Tarjeta</span></button>
                </div>
                <button onClick={confirmarPedido} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[24px] uppercase shadow-2xl active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
                  {enCheckout ? <Loader className="animate-spin" size={24}/> : `Confirmar • $ ${total}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODAL MENU TIENDA */}
        {verMenu && tiendaSeleccionada && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end">
            <div className="bg-white dark:bg-slate-900 w-full rounded-t-[40px] p-8 animate-in slide-in-from-bottom-full max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black dark:text-white italic tracking-tighter leading-none">{tiendaSeleccionada.nombre}</h2><button onClick={() => setVerMenu(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full dark:text-white"><X size={20}/></button></div>
              <div className="space-y-4 mb-24">{tiendaSeleccionada.productos.map(p => {
                const cant = carrito.find(i => i.id === p.id)?.cant || 0;
                return (
                  <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800">
                    <div className="flex-1"><p className="font-bold dark:text-white text-sm">{p.n}</p><p className="text-slate-900 dark:text-white font-black text-sm">$ {p.p}</p></div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border dark:border-slate-700 transition-all">
                      <button onClick={() => quitarDelCarrito(p.id)} className="p-1 text-red-500 active:scale-75 transition-all"><Minus size={18}/></button>
                      <span className="font-black text-sm dark:text-white w-4 text-center">{cant}</span>
                      <button onClick={() => agregarAlCarrito(p)} className="p-1 text-green-600 active:scale-75 transition-all"><Plus size={18}/></button>
                    </div>
                  </div>
                );
              })}</div>
              {carrito.length > 0 && <div className="fixed bottom-10 left-6 right-6 z-50">
                <button onClick={() => {setVerMenu(false); setTabActiva("carrito");}} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[24px] flex justify-between px-8 shadow-2xl items-center active:scale-95 transition-all uppercase tracking-widest text-xs">
                  <span>Ver Carrito ({carrito.length})</span><span className="text-xl">$ {total}</span>
                </button>
              </div>}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER: CARROUSEL INFINITO FUTURISTA */}
      <footer className="z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t p-6 pb-10">
        <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
          {[...categorias, ...categorias].map((cat, i) => (
            <button key={i} onClick={() => setCategoriaSeleccionada(cat)} 
              className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all shadow-xl active:scale-90 ${categoriaSeleccionada?.id === cat.id ? 'bg-slate-900 text-white border-slate-900 scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:text-slate-900'}`}>
              {cat.icon}
            </button>
          ))}
        </div>
      </footer>

      <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } `}</style>
    </div>
  );
}
export default App;
