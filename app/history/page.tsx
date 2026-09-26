import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HistoryGrid from "@/components/HistoryGrid";
import { getCurrentUser } from "@/lib/server/auth";
import { listStrips } from "@/lib/server/strips";

export const metadata: Metadata = { title: "My strips · Photobooth Studio" };

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <HistoryGrid userName={user.name} initialStrips={await listStrips(user.id)} />;
}
