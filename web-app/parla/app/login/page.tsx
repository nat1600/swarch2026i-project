import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { redirect } from "next/navigation";

import LoginForm from "@/forms/LoginForm";

export default async function Login() {
  const auth0 = new Auth0Client();
  const session = await auth0.getSession();
  const user = session?.user;

  // Si hay sesión, protegemos la ruta mandando al home
  if (user) {
    redirect("/home");
  }

  return <LoginForm />;

}