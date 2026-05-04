import { Suspense } from "react";

export const dynamic = "force-dynamic";
import { MeContent } from "@/components/me/MeContent";
import { MeSkeleton } from "@/components/me/MeSkeleton";

export default function ProfilePage() {
  return (
    <Suspense fallback={<MeSkeleton />}>
      <MeContent />
    </Suspense>
  );
}
