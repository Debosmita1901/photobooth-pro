import { redirect } from "next/navigation";
import BoothApp from "@/components/BoothApp";
import { getCurrentUser } from "@/lib/server/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <BoothApp userName={user.name} />;
}
