import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Sparkles, Trophy, MessageSquare } from "lucide-react";

export default async function HomePage() {
  const auth0 = new Auth0Client();
  const session = await auth0.getSession();
  const user = session?.user;

  // Si no hay sesión, protegemos la ruta mandando al login
  if (!user) {
    redirect("/login");
    return null; // Mientras se redirige, no renderizamos nada
  }

  // Obtenemos el nombre o el nickname para el saludo
  const displayName = user.given_name ||user.nickname || user.name || user.email;
  console.log(user)

  return (
    <div className="min-h-screen bg-parla-light bg-[radial-gradient(#2D83A6_1px,transparent_1px)] background-size:[20px_20px] font-sans">
      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b-4 border-parla-dark p-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-parla-blue rounded-xl flex items-center justify-center border-2 border-parla-dark shadow-[0_4px_0_0_#254159]">
              <span className="text-white font-black">P</span>
            </div>
            <span className="text-2xl font-black text-parla-dark tracking-tighter">
              Parla
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 bg-[#F0F7FA] px-3 py-1 rounded-full border-2 border-parla-blue/20 text-parla-blue font-bold">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>120 XP</span>
            </div>
            <Avatar className="border-2 border-parla-dark shadow-[0_2px_0_0_#254159]">
              <AvatarImage src={user.picture} />
              <AvatarFallback>{displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <a href="/api/auth/logout">
              <Button
                variant="ghost"
                size="icon"
                className="text-parla-red hover:bg-parla-red/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center gap-8">
        {/* WELCOME CARD */}
        <Card className="w-full bg-white border-4 border-parla-dark rounded-4xl p-8 shadow-[0_12px_0_0_#2D83A6] animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32  md:w-40 bg-parla-light rounded-full border-4 border-parla-dark overflow-hidden shadow-[0_8px_0_0_#254159] animate-bounce duration-3000">
                <img
                  src={user.picture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-xl border-2 border-parla-dark shadow-[0_4px_0_0_#254159]">
                <Sparkles className="w-6 h-6 text-parla-dark" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-parla-dark tracking-tight">
                ¡Hola,{" "}
                <span className="text-parla-blue">{displayName || "usuario"}</span>
                !
              </h1>
              <p className="text-xl font-bold text-parla-blue/80">
                Qué bueno verte de nuevo. ¿Listo para practicar hoy?
              </p>

              <div className="pt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                <Button className="h-14 px-8 bg-parla-red hover:bg-parla-red/10 border-b-8 border-[#8B0000] active:border-b-0 active:translate-y-2 transition-all rounded-2xl text-xl font-black">
                  <MessageSquare className="mr-2 w-6 h-6" />
                  IR AL FORO
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* STATS GRID (Opcional, para que no se vea vacío) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in slide-in-from-bottom duration-700">
          <div className="bg-[#E5F3F9] p-6 rounded-3xl border-4 border-parla-blue shadow-[0_8px_0_0_#2D83A6] flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl border-2 border-parla-blue flex items-center justify-center">
              <Trophy className="text-yellow-500" />
            </div>
            <div>
              <p className="font-black text-parla-dark text-lg">Racha de 5 días</p>
              <p className="font-bold text-parla-blue">¡No te detengas!</p>
            </div>
          </div>

          <div className="bg-[#FFF4F0] p-6 rounded-3xl border-4 border-[#CC7752] shadow-[0_8px_0_0_#CC7752] flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl border-2 border-[#CC7752] flex items-center justify-center">
              <MessageSquare className="text-[#CC7752]" />
            </div>
            <div>
              <p className="font-black text-parla-dark text-lg">12 Comentarios</p>
              <p className="font-bold text-[#CC7752]">En el foro global</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
