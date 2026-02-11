import { Suspense } from "react";
import { LoginContent } from "./LoginContent";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
