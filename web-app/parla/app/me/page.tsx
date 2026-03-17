"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import  HomeNavBar  from "@/components/core/HomeNavBar";
import { getInitials } from "@/lib/user-utils";

interface GraphQLLanguage {
  name: string;
}

interface GraphQLUser {
  username: string;
  email: string;
  timezone: string;
  learningLanguage: GraphQLLanguage | null;
  nativeLanguage: GraphQLLanguage | null;
}

interface GetMyProfileResponse {
  myProfile: GraphQLUser | null; // Puede ser null si el usuario no existe en la BD
}

// 1. Definimos la Query de GraphQL que armamos en el backend
const GET_MY_PROFILE = gql`
  query GetMyProfile {
    myProfile {
      username
      email
      timezone
      learningLanguage {
        name
      }
      nativeLanguage {
        name
      }
    }
  }
`;

export default function ProfilePage() {
  // Sacamos los datos de Auth0 (para la foto de perfil)
  const { user, isLoading: isAuthLoading } = useUser();
  
  // Sacamos los datos de tu backend FastAPI (para el progreso y lenguajes)
  const { data, loading: isGraphQLLoading, error } = useQuery<GetMyProfileResponse>(GET_MY_PROFILE, {
    skip: isAuthLoading || !user?.sub, 
  });

  const isLoading = isAuthLoading || isGraphQLLoading;

  // Pantalla de carga con la estética de Parla
  if (isLoading) {
    return (
      <div className="font-app min-h-screen w-full bg-polka flex items-center justify-center">
        <div className="text-6xl animate-bounce">🌍</div>
      </div>
    );
  }

  // Si hay error en la query
  if (error) {
    return (
      <div className="font-app min-h-screen w-full bg-parla-mist flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-white p-8 rounded-4xl border-4 border-parla-dark shadow-[0_8px_0_0_#254159]">
          <h2 className="font-brand text-3xl text-parla-red mb-2">¡Ups! Algo salió mal</h2>
          <p className="text-parla-dark font-bold">{error.message}</p>
          <Link href="/home" className="btn-secondary mt-6">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const profile = data?.myProfile;

  return (
    <div className="font-app min-h-screen w-full bg-polka selection:bg-parla-blue selection:text-white pb-20">
      
      <HomeNavBar 
        userPicture={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=parla"} 
        initials={getInitials(user?.given_name || user?.name || "Estudiante")}
      />

      {/* ══════════════════════════════════════
          CONTENIDO DEL PERFIL
      ══════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto px-4 mt-12">
        
        {/* CABECERA DEL USUARIO */}
        <section className="bg-white rounded-4xl border-4 border-parla-dark shadow-[0_12px_0_0_#254159] p-8 md:p-12 mb-8 relative animate-slide-in-bottom">
          <div className="flex flex-col md:flex-row items-center gap-8">
            
            {/* Avatar */}
            <div className="relative">
              <img 
                src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=parla"} 
                alt="Avatar" 
                className="w-32 h-32 rounded-full border-4 border-parla-dark bg-parla-mist object-cover"
              />
              <div className="absolute -bottom-2 -right-2 bg-parla-red text-white text-xl p-2 rounded-full border-4 border-parla-dark rotate-12">
                👑
              </div>
            </div>

            {/* Info Básica */}
            <div className="text-center md:text-left flex-1">
              <h1 className="font-brand text-5xl text-parla-dark mb-2">
                {profile?.username || user?.name || "Estudiante"}
              </h1>
              <p className="text-parla-blue font-bold text-lg mb-1">
                {profile?.email || user?.email}
              </p>
              <div className="inline-flex items-center gap-2 bg-parla-mist border-2 border-parla-dark text-parla-dark font-extrabold text-sm px-4 py-1.5 rounded-full mt-2">
                📍 Zona horaria: {profile?.timezone || "Desconocida"}
              </div>
            </div>
          </div>
        </section>

        {/* TARJETAS DE ESTADÍSTICAS E IDIOMAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta: Idioma que está aprendiendo */}
          <div className="feat-card bg-white animate-slide-in-bottom animate-delay-100 group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-brand text-3xl text-parla-blue">Aprendiendo</h3>
              <span className="text-4xl group-hover:scale-110 group-hover:rotate-12 transition-transform">🚀</span>
            </div>
            <p className="text-parla-dark font-black text-2xl">
              {profile?.learningLanguage?.name || "Aún no elegido"}
            </p>
            <p className="text-parla-dark/60 font-bold mt-2">
              Nativo en: {profile?.nativeLanguage?.name}
            </p>
          </div>

          {/* Tarjeta: Racha (Mock visual para el futuro) */}
          <div className="feat-card bg-[#fff4f7] border-parla-red animate-slide-in-bottom animate-delay-200 group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-brand text-3xl text-parla-red">Tu Racha</h3>
              <span className="text-4xl group-hover:scale-110 group-hover:-rotate-12 transition-transform">🔥</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-parla-dark font-black text-5xl">0</span>
              <span className="text-parla-dark font-bold text-xl">días</span>
            </div>
            <p className="text-parla-red font-bold mt-2">
              ¡Haz tu primera lección hoy!
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}