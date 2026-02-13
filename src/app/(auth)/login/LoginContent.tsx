'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Loader2, Mail, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function LoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [usePassword, setUsePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read mode from URL parameters (signup or signin)
  useEffect(() => {
    const mode = searchParams?.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
      setUsePassword(true);
    } else if (mode === 'signin') {
      setIsSignUp(false);
      setUsePassword(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      let result;

      if (usePassword) {
        if (isSignUp) {
          result = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
        } else {
          result = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        }
      } else {
        result = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      }

      const { error } = result;
      if (error) throw error;

      if (usePassword && !isSignUp) {
        // Redirect manually if needed, or let the session handler take over
        window.location.href = "/";
      } else {
        setSent(true);
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "Ocurrió un error.";
      let message = rawMessage || "Ocurrió un error.";
      if (message.includes("rate limit") || message.includes("Rate limit") || message.includes("too many requests")) {
        message = "Has excedido el límite de intentos. Usa el inicio con contraseña o espera 60 segundos.";
      } else if (message.includes("Invalid login credentials")) {
        message = "Correo o contraseña incorrectos.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Visual & Branding */}
      <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-90 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
          alt="Background"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="absolute inset-0 object-cover opacity-50"
        />
        
        <div className="relative z-20 p-12 text-white flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center w-full"
          >
            <div className="mb-10 flex justify-center w-full">
              <Image
                src="/logo-clean.png"
                alt="EcomIA"
                width={1248}
                height={374}
                className="object-contain h-[224px] w-auto drop-shadow-xl"
                priority
              />
            </div>
            <p className="text-xl text-gray-300 leading-relaxed text-center max-w-md">
              La plataforma inteligente para crear, gestionar y escalar tu tienda online con el poder de la Inteligencia Artificial.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-black">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800"
        >
          {!sent ? (
            <>
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {isSignUp && usePassword ? "Crear Cuenta" : "Bienvenido"}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {isSignUp && usePassword
                    ? "Regístrate para comenzar tu viaje en e-commerce con IA"
                    : "Ingresa tu correo para acceder a tu panel de control"}
                </p>
              </div>

              {/* Toggle: Iniciar Sesión vs Crear Cuenta */}
              {usePassword && (
                <div className="flex gap-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md font-medium transition-all",
                      !isSignUp
                        ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md font-medium transition-all",
                      isSignUp
                        ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    Crear Cuenta
                  </button>
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                        placeholder="nombre@empresa.com"
                      />
                    </div>
                  </div>

                  {usePassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2"
                    >
                      <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="password"
                          type="password"
                          required={usePassword}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setUsePassword(!usePassword);
                      setIsSignUp(false);
                      setError(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    {usePassword ? "Usar Magic Link" : "Usar contraseña"}
                  </button>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98]",
                    loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {usePassword ? (
                        isSignUp ? "Registrarse" : "Iniciar Sesión"
                      ) : (
                        "Continuar con Magic Link"
                      )}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
              >
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Revisa tu correo!</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Hemos enviado un enlace de acceso seguro a <span className="font-medium text-gray-900 dark:text-white">{email}</span>
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Intentar con otro correo
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
