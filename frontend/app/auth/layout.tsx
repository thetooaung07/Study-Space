import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StudySpace - Authentication",
  description: "Sign in or create your StudySpace account",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
       {children}
    </>
  );
}