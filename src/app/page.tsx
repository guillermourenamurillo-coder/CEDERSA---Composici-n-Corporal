"use client";

import { useSession, signOut } from "next-auth/react";
import { LoginScreen } from "@/components/login-screen";
import { AppShell } from "@/components/app-shell";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <AppShell />;
}
