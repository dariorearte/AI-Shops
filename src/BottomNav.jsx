import { Home, Search, ShoppingBag, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 pb-6">
      <button className="flex flex-col items-center gap-1 text-blue-600">
        <Home size={24} />
        <span className="text-[10px] font-medium">Inicio</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500">
        <Search size={24} />
        <span className="text-[10px] font-medium">Explorar</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500">
        <ShoppingBag size={24} />
        <span className="text-[10px] font-medium">Tiendas</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500">
        <User size={24} />
        <span className="text-[10px] font-medium">Perfil</span>
      </button>
    </div>
  );
};

export default BottomNav;
