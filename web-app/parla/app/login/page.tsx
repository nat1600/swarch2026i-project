import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

import LoginForm from "@/forms/LoginForm";

export default async function Login() {
  const session = await auth0.getSession();
  const user = session?.user;

  // Si hay sesión, protegemos la ruta mandando al home
  if (user) {
    redirect("/home");
  }

  return <LoginForm />;

}