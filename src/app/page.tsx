import Link from "next/link";
import { ArrowRight, UserPlus, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black z-0" />
      
      <div className="relative z-10 text-center max-w-2xl">
        <h1 className="text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          EcomIA
        </h1>
        <p className="text-xl text-gray-300 mb-12 leading-relaxed">
          Tu socio inteligente para el comercio electrónico. 
          Crea, gestiona y escala tu negocio con el poder de la IA Generativa.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Crear Cuenta - Primary CTA */}
          <Link 
            href="/login?mode=signup" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-indigo-600/50"
          >
            <UserPlus size={22} />
            Crear Cuenta
          </Link>
          
          {/* Iniciar Sesión - Secondary CTA */}
          <Link 
            href="/login?mode=signin" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full font-semibold text-lg transition-all border border-white/30 hover:border-white/50"
          >
            <LogIn size={22} />
            Iniciar Sesión
          </Link>
        </div>

        {/* Helper text */}
        <p className="text-sm text-gray-400 mt-8">
          ¿Nuevo en EcomIA? Comienza gratis. ¿Ya tienes cuenta? Inicia sesión.
        </p>
      </div>
    </div>
  );
}
