import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, ShoppingBag, User, Home, MapPin, Bike, Star, Clock, X, Plus, Minus, Trash2, CreditCard, Banknote, Loader, CheckCircle2, ChevronRight } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) { map.setView(position, 15); setTimeout(() => { map.invalidateSize(); }, 400); }
  }, [position, map]);
  return null;
}

function App() {
  const [tabActiva, setTabActiva] = useState("inicio");
  const [position, setPosition] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [verMenu, setVerMenu] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [enCheckout, setEnCheckout] = useState(false);
  const [rastreando, setRastreando] = useState(false);
  const [motoPos, setMotoPos] = useState(null);
  const [pedidoEntregado, setPedidoEntregado] = useState(false);
  const [historialPedidos, setHistorialPedidos] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude; const lng = pos.coords.longitude;
      setPosition([lat, lng]);
      setTiendas([
        { 
          id: 1, nombre: "Café Regional", 
          foto: "https://images.unsplash.com", 
          lat: lat + 0.003, lng: lng + 0.003, 
          productos: [{id: 101, n: "Café Especial", p: 1500}, {id: 102, n: "Croissant XL", p: 1200}] 
        },
        { 
          id: 2, nombre: "Electro AI-Shop", 
          foto: "https://images.unsplash.com", 
          lat: lat - 0.003, lng: lng - 0.003, 
          productos: [{id: 201, n: "Cargador C", p: 4500}, {id: 202, n: "Smartwatch", p: 12000}] 
        }
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

  const finalizarPedido = () => {
    const nuevoPedido = {
      id: Math.random().toString(36).substr(2, 5).toUpperCase(),
      tienda: tiendaSeleccionada?.nombre || "AI Shop",
      fecha: "Recién",
      total: total,
      estado: "Entregado"
    };
    setHistorialPedidos([nuevoPedido, ...historialPedidos]);
    setRastreando(false);
    setPedidoEntregado(false);
    setCarrito([]);
    setMotoPos(null);
    setTabActiva("pedidos");
    setTiendaSeleccionada(null);
  };

  const confirmarPedido = () => {
    setEnCheckout(true);
    const tiendaOrigen = tiendas[0];
    setTimeout(() => {
      setEnCheckout(false); setTabActiva("inicio"); setRastreando(true);
      setMotoPos([tiendaOrigen.lat, tiendaOrigen.lng]);
      let t = 0;
      const interval = setInterval(() => {
        t += 0.1; 
        if (t >= 1) { clearInterval(interval); setMotoPos(position); setPedidoEntregado(true); }
        else { setMotoPos([tiendaOrigen.lat + (position[0] - tiendaOrigen.lat) * t, tiendaOrigen.lng + (position[1] - tiendaOrigen.lng) * t]); }
      }, 1000);
    }, 1500);
  };

  return (
    <GoogleOAuthProvider clientId="TU_ID">
      <div className="flex flex-col h-screen w-full bg-white dark:bg-slate-950 overflow-hidden font-sans antialiased transition-colors duration-300">
        
        {/* HEADER */}
        <header className="z-50 bg-white dark:bg-slate-900 border-b p-4 px-6 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTabActiva("inicio")}>
            <div className="w-11 h-11 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center font-black text-xl text-white dark:text-slate-900">AI</div>
            <h1 className="text-2xl font-black italic text-slate-800 dark:text-white leading-none tracking-tighter">Shops</h1>
          </div>
          <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white active:scale-90 transition-all"><User size={22}/></button>
        </header>

        <main className="flex-1 relative overflow-hidden">
          {tabActiva === "inicio" && (
            <div className="h-full w-full relative">
              {position && (
                <MapContainer center={position} zoom={15} style={{ height: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <RecenterMap position={position} />
                  <Marker position={position} icon={L.divIcon({ html: `<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>` })} />
                  {tiendas.map(t => (
                    <Marker key={t.id} position={[t.lat, t.lng]} eventHandlers={{ click: () => setTiendaSeleccionada(t) }}
                      icon={L.divIcon({ html: `<div class="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl border-2 border-white flex items-center justify-center text-white dark:text-slate-900 shadow-xl"><MapPin size={20}/></div>` })}
                    />
                  ))}
                  {rastreando && motoPos && <Marker position={motoPos} icon={L.divIcon({ html: `<div class="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg text-white animate-bounce"><Bike size={18}/></div>` })} />}
                </MapContainer>
              )}

              {/* TRACKER FLOTANTE */}
              {rastreando && (
                <div className="absolute top-4 left-4 right-4 z-50 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                  <div className={`p-3 rounded-xl text-white transition-colors ${pedidoEntregado ? 'bg-green-500' : 'bg-blue-600'}`}>{pedidoEntregado ? <CheckCircle2/> : <Bike/>}</div>
                  <div className="flex-1">
                    <p className={`font-black text-[10px] uppercase tracking-widest ${pedidoEntregado ? 'text-green-600' : 'text-blue-600'}`}>{pedidoEntregado ? "¡Éxito!" : "En Camino"}</p>
                    <p className="text-sm font-bold dark:text-white">{pedidoEntregado ? "Tu pedido está en la puerta" : "El repartidor va hacia ti"}</p>
                  </div>
                  {pedidoEntregado && <button onClick={finalizarPedido} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white"><X size={20}/></button>}
                </div>
              )}

              {/* CARD TIENDA */}
              {tiendaSeleccionada && !rastreando && (
                <div className="absolute bottom-6 left-4 right-4 z-40 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-10">
                  <div className="relative h-28 w-full bg-slate-100 dark:bg-slate-800">
                    <img src={tiendaSeleccionada.foto} className="w-full h-full object-cover" alt="Tienda" />
                    <button onClick={() => setTiendaSeleccionada(null)} className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-md rounded-full text-white"><X size={18}/></button>
                  </div>
                  <div className="p-5 flex justify-between items-center"><h2 className="font-black text-2xl dark:text-white leading-none">{tiendaSeleccionada.nombre}</h2><button onClick={() => setVerMenu(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-6 py-3 rounded-2xl uppercase text-[10px] tracking-widest active:scale-95 transition-all">Explorar Tienda</button></div>
                </div>
              )}
            </div>
          )}

          {/* VISTA PEDIDOS */}
          {tabActiva === "pedidos" && (
            <div className="p-6 h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto pb-24">
              <h2 className="text-4xl font-black italic mb-8 dark:text-white tracking-tighter">Historial</h2>
              {historialPedidos.length === 0 ? (
                <div className="text-center mt-20 opacity-20 font-black uppercase text-2xl tracking-tighter">Sin pedidos</div>
              ) : (
                <div className="space-y-4">
                  {historialPedidos.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl text-slate-900 dark:text-white"><ShoppingBag size={24}/></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start"><h3 className="font-black dark:text-white leading-none">{p.tienda}</h3><span className="text-[10px] font-black text-slate-400">#{p.id}</span></div>
                        <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">{p.fecha} • ${p.total}</p>
                        <div className="flex items-center gap-1 mt-2 text-green-500"><CheckCircle2 size={12}/><span className="text-[9px] font-black uppercase tracking-widest">{p.estado}</span></div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300"/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA CARRITO */}
          {tabActiva === "carrito" && (
            <div className="p-6 h-full bg-white dark:bg-slate-950 overflow-y-auto pb-32">
              <h2 className="text-4xl font-black italic mb-8 dark:text-white tracking-tighter">Checkout</h2>
              {carrito.length === 0 ? (
                <div className="text-center mt-20 opacity-20 font-black uppercase text-2xl tracking-tighter">Vacío</div>
              ) : (
                <>
                  <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-900 rounded-[28px] border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 italic">Enviar a:</p>
                    <div className="flex items-center gap-3 font-bold text-sm dark:text-white"><MapPin size={18} className="text-blue-600"/> Mi ubicación actual</div>
                  </div>
                  <div className="space-y-3 mb-8">
                    {carrito.map(i => (
                      <div key={i.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl">
                        <div className="flex gap-3 items-center"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-black text-xs dark:text-white">{i.cant}x</span><p className="font-bold text-sm dark:text-white">{i.n}</p></div>
                        <p className="font-black text-sm dark:text-white">$ {i.p * i.cant}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button onClick={() => setMetodoPago('efectivo')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${metodoPago === 'efectivo' ? 'border-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-white' : 'border-slate-100 opacity-40'}`}><Banknote size={20}/><span className="text-[10px] font-black uppercase">Efectivo</span></button>
                    <button onClick={() => setMetodoPago('tarjeta')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${metodoPago === 'tarjeta' ? 'border-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-white' : 'border-slate-100 opacity-40'}`}><CreditCard size={20}/><span className="text-[10px] font-black uppercase">Tarjeta</span></button>
                  </div>
                  <button onClick={confirmarPedido} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[24px] uppercase text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                    {enCheckout ? <Loader className="animate-spin"/> : <>Confirmar • $ {total}</>}
                  </button>
                </>
              )}
            </div>
          )}

          {/* MODAL MENU */}
          {verMenu && tiendaSeleccionada && (
            <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end">
              <div className="bg-white dark:bg-slate-900 w-full rounded-t-[40px] p-6 animate-in slide-in-from-bottom-full max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black dark:text-white italic tracking-tighter leading-none">{tiendaSeleccionada.nombre}</h2><button onClick={() => setVerMenu(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full dark:text-white"><X size={20}/></button></div>
                <div className="space-y-4 mb-24">
                  {tiendaSeleccionada.productos.map(p => {
                    const cant = carrito.find(i => i.id === p.id)?.cant || 0;
                    return (
                      <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all">
                        <div className="flex-1"><p className="font-bold dark:text-white text-sm">{p.n}</p><p className="text-slate-900 dark:text-white font-black text-sm">$ {p.p}</p></div>
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border dark:border-slate-700 transition-all">
                          <button onClick={() => quitarDelCarrito(p.id)} className="p-1 text-red-500 active:scale-75 transition-transform"><Minus size={18}/></button>
                          <span className="font-black text-sm dark:text-white w-4 text-center">{cant}</span>
                          <button onClick={() => agregarAlCarrito(p)} className="p-1 text-green-600 active:scale-75 transition-transform"><Plus size={18}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {carrito.length > 0 && (
                  <div className="fixed bottom-8 left-6 right-6 z-50 animate-in zoom-in duration-300">
                    <button onClick={() => {setVerMenu(false); setTabActiva("carrito");}} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[24px] flex justify-between px-8 shadow-2xl items-center active:scale-95 transition-all uppercase tracking-tighter">
                      <span>Ver Carrito ({carrito.length})</span><span className="text-xl">$ {total}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className="z-50 bg-white dark:bg-slate-900 border-t flex justify-around items-center py-4 pb-8 px-4 transition-all">
          <button onClick={() => setTabActiva("inicio")} className={`flex flex-col items-center gap-1 transition-all ${tabActiva === 'inicio' ? 'text-slate-900 dark:text-white scale-110' : 'text-slate-400 opacity-40'}`}><Home size={26}/><span className="text-[9px] font-black uppercase">Inicio</span></button>
          <button onClick={() => setTabActiva("pedidos")} className={`flex flex-col items-center gap-1 transition-all ${tabActiva === 'pedidos' ? 'text-slate-900 dark:text-white scale-110' : 'text-slate-400 opacity-40'}`}><Bike size={26}/><span className="text-[9px] font-black uppercase">Pedidos</span></button>
          <button onClick={() => setTabActiva("carrito")} className={`flex flex-col items-center gap-1 transition-all ${tabActiva === 'carrito' ? 'text-slate-900 dark:text-white scale-110' : 'text-slate-400 opacity-40'}`}>
            <div className="relative"><ShoppingBag size={26}/>{carrito.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white dark:border-slate-900">{carrito.length}</span>}</div>
            <span className="text-[9px] font-black uppercase">Carrito</span>
          </button>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
