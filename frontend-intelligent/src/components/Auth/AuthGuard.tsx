"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated in localStorage or sessionStorage
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    if (!token) {
      // No token, redirect to sign-in
      router.push("/auth/sign-in");
    } else {
      // Token exists, show dashboard
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router]);

  // Show loading while checking authentication
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Show content if authenticated
  return <>{children}</>;
}
