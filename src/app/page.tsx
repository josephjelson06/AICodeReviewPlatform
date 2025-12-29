import Link from "next/link";
import { ArrowRight, Bot, Shield, Zap } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
