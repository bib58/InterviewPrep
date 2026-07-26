"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbar = pathname.startsWith("/call/");

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}
