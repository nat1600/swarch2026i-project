import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { HomeContent } from "@/components/home/HomeContent";
import { getDisplayName, getInitials } from "@/lib/user-utils";
import { checkUserExistsAction } from "@/actions/auth/authActions";

export default async function HomePage() {

  const session = await auth0.getSession();
  if (!session?.user) {
    redirect("/login");
  }
  const { exists } = await checkUserExistsAction();


  if (!exists) {
    redirect("/onboarding");
  }

  
  const displayName = getDisplayName(session?.user);

  return (
    <HomeContent
      user={{
        picture: session?.user.picture as string,
        displayName: displayName,
        initials: getInitials(displayName),
      }}
    />
  );
}
