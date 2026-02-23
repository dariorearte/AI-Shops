import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, ShoppingBag, User, Home, MapPin, Bike, Star, Clock, X, Plus } from 'lucide-react';
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
  const [usuario, setUsuario] = useState(null);

  // Inicialización de datos
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setPosition([lat, lng]);
      setTiendas([
        { id: 1, nombre: "Café Regional", rubro: "Gastronomía", rating: 4.8, tiempo: "15 min", lat: lat + 0.005, lng: lng + 0.005, color: "#1e293b", productos: [{id: 101, n: "Café con Leche", p: 1500}] },
        { id: 2, nombre: "Electro AI-Shop", rubro: "Tecnología", rating: 4.5, tiempo: "30 min", lat: lat - 0.005, lng: lng - 0.004, color: "#1e293b", productos: [{id: 201, n: "Cargador C", p: 4500}] },
      ]);
    });
  }, []);

  const agregarAlCarrito = (p, tId) => setCarrito([...carrito, { ...p, tId }]);

  return (
    <GoogleOAuthProvider clientId="TU_ID_CLIENTE_AQUI">
      <div className="flex flex-col h-screen w-full bg-white dark:bg-slate-950 overflow-hidden font-sans antialiased transition-colors duration-300">
        
        {/* --- HEADER: MARCA + LOGIN --- */}
        <header className="z-50 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
              <span className="text-white dark:text-slate-900 font-black text-2xl tracking-tighter leading-none">AI</span>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-800 dark:text-white leading-none">Shops</h1>
          </div>

          <div className="flex items-center">
            {!usuario ? (
              <div className="scale-90 rounded-xl grayscale hover:grayscale-0 transition-all overflow-hidden">
                <GoogleLogin onSuccess={() => setUsuario({ nombre: "Usuario" })} onError={() => console.log('Error')} />
              </div>
            ) : (
              <button onClick={() => setUsuario(null)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 relative active:scale-95 transition-all">
                <User size={24} className="text-slate-900 dark:text-white" />
                <div className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900"></div>
              </button>
            )}
          </div>
        </header>

        {/* --- BUSCADOR ESTILO AMAZON/UBER --- */}
        <div className="absolute top-24 left-4 right-4 z-40">
          <div className="flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-2xl p-2 px-4 border border-slate-200 dark:border-slate-700">
            <Search size={20} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar tiendas o productos..." 
              className="flex-1 text-sm outline-none bg-transparent h-10 dark:text-white"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* --- MAPA PRINCIPAL --- */}
        <main className="flex-1 relative z-0">
          {position && (
            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <RecenterMap position={position} />
              
              {tiendas.map(t => (
                <Marker 
                  key={t.id} 
                  position={[t.lat, t.lng]} 
                  eventHandlers={{ click: () => setTiendaSeleccionada(t) }}
                  icon={L.divIcon({
                    className: '',
                    html: `<div class="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl border-2 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-white dark:text-slate-900"><MapPin size={20}/></div>`
                  })}
                />
              ))}
            </MapContainer>
          )}

          {/* TARJETA DE TIENDA */}
          {tiendaSeleccionada && (
            <div className="absolute bottom-6 left-4 right-4 z-40 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-black text-xl dark:text-white">{tiendaSeleccionada.nombre}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Star size={14} className="fill-yellow-400 stroke-yellow-400"/> {tiendaSeleccionada.rating}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {tiendaSeleccionada.tiempo}</span>
                  </div>
                </div>
                <button onClick={() => setTiendaSeleccionada(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full dark:text-white"><X size={16}/></button>
              </div>
              <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl mt-4 active:scale-95 transition-transform shadow-lg">
                VER MENÚ
              </button>
            </div>
          )}
        </main>

        {/* --- FOOTER: TODOS LOS ICONOS NEGROS --- */}
        <footer className="z-50 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-around items-center py-3 pb-8 px-4">
          <button className="flex flex-col items-center gap-1 text-slate-900 dark:text-white">
            <Home size={26} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase">Inicio</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-slate-900 dark:text-white opacity-40 hover:opacity-100 transition-opacity">
            <Bike size={26} strokeWidth={2} />
            <span className="text-[10px] font-bold uppercase">Pedidos</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-slate-900 dark:text-white transition-all relative">
            <div className="relative">
              <ShoppingBag size={26} strokeWidth={2} />
              {carrito.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white dark:border-slate-950 shadow-sm">
                  {carrito.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase">Carrito</span>
          </button>
        </footer>

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
