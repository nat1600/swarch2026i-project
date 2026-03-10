import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { redirect } from "next/navigation";
import { HomeContent } from "@/components/home/HomeContent";
import { getDisplayName, getInitials } from "@/lib/user-utils";

export default async function HomePage() {
  const auth0 = new Auth0Client();
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  const displayName = getDisplayName(user);

  return (
    <HomeContent
      user={{
        picture: user.picture as string,
        displayName: displayName,
        initials: getInitials(displayName),
      }}
    />
  );
}
