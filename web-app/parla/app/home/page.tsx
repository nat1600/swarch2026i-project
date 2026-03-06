import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { redirect } from "next/navigation";
import { HomeContent } from "@/components/home/HomeContent";

export default async function HomePage() {
  const auth0 = new Auth0Client();
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/login");
    return null;
  }

  const displayName =
    user.given_name || user.nickname || user.name || user.email || "usuario";

  const initials = (displayName as string)
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <HomeContent
      user={{
        picture: user.picture as string,
        displayName: displayName as string,
        initials,
      }}
    />
  );
}
