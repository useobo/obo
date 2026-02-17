"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { LandingPage } from "@/components/landing/landing-page";

export function SignedInWrapper({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-100 text-text-secondary">
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return <>{children}</>;
}
