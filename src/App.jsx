import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, X, ShoppingBag, Plus, Trash2, MapPin, CreditCard, Banknote, CheckCircle2, Bike, Check, Loader, User, LogOut } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// --- COMPONENTE PARA RE-CENTRAR EL MAPA ---
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
      setTimeout(() => { map.invalidateSize(); }, 400);
    }
  }, [position, map]);
  return null;
}

function App() {
  const [position, setPosition] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [verCarrito, setVerCarrito] = useState(false);
  const [enCheckout, setEnCheckout] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [rastreando, setRastreando] = useState(false);
  const [motoPos, setMotoPos] = useState(null);
  const [pedidoEntregado, setPedidoEntregado] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setPosition([lat, lng]);
      setTiendas([
        { id: 1, nombre: "Café Regional", rubro: "Gastronomía", lat: lat + 0.005, lng: lng + 0.005, color: "#f97316", productos: [{id: 101, n: "Café con Leche", p: 1500}, {id: 102, n: "Medialunas x3", p: 1200}] },
        { id: 2, nombre: "Electro AI-Shop", rubro: "Tecnología", lat: lat - 0.005, lng: lng - 0.004, color: "#3b82f6", productos: [{id: 201, n: "Cargador C", p: 4500}, {id: 202, n: "Auriculares BT", p: 12000}] },
        { id: 3, nombre: "Tienda de Ropa", rubro: "Moda", lat: lat + 0.004, lng: lng - 0.006, color: "#a855f7", productos: [{id: 301, n: "Remera Oversize", p: 8500}, {id: 302, n: "Jean Slim", p: 15000}] }
      ]);
    });
  }, []);

  const agregarAlCarrito = (producto, tiendaId) => {
    setCarrito(prev => {
      const itemExistente = prev.find(item => item.id === producto.id);
      if (itemExistente) return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...prev, { ...producto, tiendaId, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (id) => {
    setCarrito(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.cantidad > 1) return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i);
      return prev.filter(i => i.id !== id);
    });
  };

  const totalCarrito = carrito.reduce((acc, item) => acc + (item.p * item.cantidad), 0);

  const iniciarRastreo = () => {
    setPedidoEnviado(true);
    const tiendaId = carrito[0]?.tiendaId;
    const tiendaOrigen = tiendas.find(t => t.id === tiendaId) || tiendas[0];
    setTimeout(() => {
      setPedidoEnviado(false); setEnCheckout(false); setVerCarrito(false); setRastreando(true);
      setMotoPos([tiendaOrigen.lat, tiendaOrigen.lng]);
      let t = 0;
      const interval = setInterval(() => {
        t += 0.02; 
        if (t >= 1) { clearInterval(interval); setMotoPos(position); setPedidoEntregado(true); }
        else { setMotoPos([tiendaOrigen.lat + (position[0] - tiendaOrigen.lat) * t, tiendaOrigen.lng + (position[1] - tiendaOrigen.lng) * t]); }
      }, 100);
    }, 2000);
  };

  const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const tiendasFiltradas = tiendas.filter(t => normalizar(t.nombre).includes(normalizar(busqueda)));

  const crearIcono = (color) => L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  const iconoMoto = L.divIcon({
    className: 'moto-icon',
    html: `<div style="background-color: #2563eb; padding: 8px; border-radius: 50%; color: white; border: 2px solid white; box-shadow: 0 0 15px rgba(37,99,235,0.5); display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
           </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  return (
    <GoogleOAuthProvider clientId="724623789456-example.apps.googleusercontent.com">
      <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden font-sans antialiased">
        
        <header className="flex items-center justify-between p-4 px-8 shadow-md z-50 border-b">
          <div className="flex items-center gap-5 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-[24px] shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-gray-50 overflow-visible transition-all">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org" style={{ shapeRendering: 'geometricPrecision' }} className="z-10">
                <defs><filter id="ultraShadow"><feDropShadow dx="0" dy="1.8" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4"/></filter></defs>
                <path d="M9 6.5V5.2C9 3.43269 10.3431 2 12 2C13.6569 2 15 3.43269 15 5.2V6.5" stroke="black" strokeWidth="2" strokeLinecap="round" opacity="0.08" />
                <path d="M9 6.5V5.2C9 3.43269 10.3431 2 12 2C13.6569 2 15 3.43269 15 5.2V6.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" filter="url(#ultraShadow)" />
                <path d="M5 6.5H19L21.2 20.8C21.4 22.5 20.1 24 18.4 24H5.6C3.9 24 2.6 22.5 2.8 20.8L5 6.5Z" fill="white" filter="url(#ultraShadow)" />
                <circle cx="12" cy="15.2" r="7.2" fill="white" filter="url(#ultraShadow)" />
                <circle cx="12" cy="15.2" r="5.2" fill="black" />
                <text x="12" y="15.7" textAnchor="middle" dominantBaseline="middle" fontSize="6.2" fontWeight="1000" fill="white">AI</text>
              </svg>
            </div>
            <span className="text-4xl font-black italic tracking-tighter">AI Shops</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setVerCarrito(true)} className="relative p-3 bg-gray-50 rounded-2xl border">
              <ShoppingBag size={24} className="text-blue-600" />
              {carrito.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg">{carrito.length}</span>}
            </button>

            {!usuario ? (
              <div className="scale-90 overflow-hidden rounded-xl">
                <GoogleLogin onSuccess={() => setUsuario({ nombre: "Sr. Stark" })} onError={() => console.log('Login Failed')} useOneTap />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 p-2 pr-4 rounded-2xl border relative">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white"><User size={20}/></div>
                <div className="flex flex-col"><span className="text-[10px] font-black text-blue-600 uppercase">Bienvenido</span><span className="text-xs font-black uppercase tracking-tighter">{usuario.nombre}</span></div>
                <button onClick={() => setUsuario(null)} className="absolute -top-1 -right-1 bg-white border rounded-full p-1 shadow-sm hover:text-red-500"><LogOut size={12}/></button>
              </div>
            )}
          </div>
        </header>

        <div className="flex flex-1 relative overflow-hidden">
          <main className="flex-1 relative">
            {position && (
              <MapContainer center={position} zoom={14} className="h-full w-full z-10">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={position} icon={crearIcono('#000000')}><Popup>Tu Casa</Popup></Marker>
                {rastreando && motoPos && <Marker position={motoPos} icon={iconoMoto} />}
                {!rastreando && tiendasFiltradas.map((t) => (
                  <Marker key={t.id} position={[t.lat, t.lng]} icon={crearIcono(t.color)} eventHandlers={{ click: () => setTiendaSeleccionada(t) }} />
                ))}
                <RecenterMap position={rastreando ? motoPos : position} />
              </MapContainer>
            )}

            {rastreando && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-6 border-4 border-blue-600 min-w-[320px]">
                <div className={`${pedidoEntregado ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600 animate-bounce'} p-4 rounded-2xl`}>{pedidoEntregado ? <Check size={32} /> : <Bike size={32} />}</div>
                <div className="flex-1"><h3 className="font-black text-xl italic uppercase leading-none">{pedidoEntregado ? '¡Llegó!' : 'En camino'}</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pedidoEntregado ? 'Misión cumplida' : 'Siguiendo ruta...'}</p></div>
                {pedidoEntregado && <button onClick={() => window.location.reload()} className="bg-green-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg">Finalizar</button>}
              </div>
            )}
          </main>

          <aside className={`absolute right-0 top-0 h-full bg-white shadow-2xl z-40 transition-all duration-500 transform ${tiendaSeleccionada ? 'translate-x-0 w-full md:w-96' : 'translate-x-full w-0'}`}>
            {tiendaSeleccionada && (
              <div className="flex flex-col h-full bg-gray-50">
                <div className="p-8 bg-black text-white relative">
                  <button onClick={() => setTiendaSeleccionada(null)} className="absolute top-4 right-4"><X size={24} /></button>
                  <h2 className="text-3xl font-black italic uppercase leading-none">{tiendaSeleccionada.nombre}</h2>
                  <span className="text-[10px] font-bold bg-blue-600 px-3 py-1 rounded-full uppercase mt-2 inline-block">MERCADO</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {tiendaSeleccionada.productos.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between p-5 bg-white rounded-3xl shadow-sm border">
                      <div><p className="font-bold text-sm">{prod.n}</p><p className="text-blue-600 font-black text-lg">${prod.p}</p></div>
                      <button onClick={() => agregarAlCarrito(prod, tiendaSeleccionada.id)} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg active:scale-90"><Plus size={20} /></button>
                    </div>
                  ))}
                </div>
                {carrito.length > 0 && <div className="p-6 bg-white border-t"><button onClick={() => {setVerCarrito(true); setEnCheckout(true);}} className="w-full bg-blue-600 text-white font-black py-4 rounded-3xl shadow-xl uppercase text-xs italic tracking-widest">Confirmar Pedido</button></div>}
              </div>
            )}
          </aside>

          <aside className={`absolute right-0 top-0 h-full bg-white shadow-2xl z-50 transition-all duration-500 transform ${verCarrito ? 'translate-x-0 w-full md:w-96' : 'translate-x-full w-0'}`}>
            <div className="flex flex-col h-full relative">
              {!enCheckout ? (
                <>
                  <div className="p-8 border-b flex justify-between items-center"><h2 className="text-2xl font-black italic text-blue-600 uppercase">Mi Bolsa</h2><button onClick={() => setVerCarrito(false)}><X size={28} /></button></div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 px-8">
                    {carrito.length === 0 ? <p className="text-center opacity-30 mt-20 font-black uppercase tracking-tighter">Tu bolsa está vacía</p> : 
                      carrito.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-3xl border">
                          <div><p className="font-bold text-sm">{item.n} x{item.cantidad}</p><p className="font-black text-blue-600">${item.p * item.cantidad}</p></div>
                          <button onClick={() => quitarDelCarrito(item.id)} className="text-red-500"><Trash2 size={20} /></button>
                        </div>
                      ))
                    }
                  </div>
                  {carrito.length > 0 && <div className="p-8 border-t bg-gray-50"><button onClick={() => setEnCheckout(true)} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl uppercase text-xs shadow-xl italic tracking-widest">Ir al Checkout</button></div>}
                </>
              ) : (
                <div className="flex flex-col h-full bg-gray-50 p-8 overflow-y-auto">
                  {pedidoEnviado ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Loader size={60} className="text-blue-600 animate-spin mb-4" />
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter">Procesando...</h2>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-8"><button onClick={() => setEnCheckout(false)} className="p-2 bg-white rounded-xl shadow-sm"><X size={20} /></button><h2 className="text-2xl font-black italic uppercase tracking-tighter">Finalizar</h2></div>
                      <div className="space-y-6 flex-1">
                        <section className="bg-blue-600 p-6 rounded-[32px] text-white shadow-xl">
                          <h3 className="text-lg font-black leading-tight mb-2 italic uppercase">Destino</h3>
                          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest border-t border-blue-500 pt-2 flex items-center gap-2"><MapPin size={12}/> Tu ubicación GPS</p>
                        </section>
                        <section>
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest font-black italic">Forma de Pago</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setMetodoPago('efectivo')} className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${metodoPago === 'efectivo' ? 'border-blue-600 bg-white text-blue-600 shadow-md' : 'bg-gray-200 opacity-60'}`}>
                              <Banknote size={24} /><span className="text-[10px] font-black mt-2">EFECTIVO</span>
                            </button>
                            <button onClick={() => setMetodoPago('tarjeta')} className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${metodoPago === 'tarjeta' ? 'border-blue-600 bg-white text-blue-600 shadow-md' : 'bg-gray-200 opacity-60'}`}>
                              <CreditCard size={24} /><span className="text-[10px] font-black mt-2">TARJETA</span>
                            </button>
                          </div>
                        </section>
                        <div className="bg-white p-6 rounded-3xl border shadow-sm flex justify-between font-black text-xl italic uppercase tracking-tighter"><span>Total Final</span><span className="text-blue-600">${totalCarrito}</span></div>
                      </div>
                      <button onClick={iniciarRastreo} className="w-full bg-black text-white font-black py-5 rounded-3xl shadow-2xl hover:bg-blue-600 transition-all uppercase text-xs mt-8 italic tracking-widest">Confirmar Compra</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;









