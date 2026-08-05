import { Fraunces, Inter } from "next/font/google";
import "./public.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Tipografía de las landings públicas (Fraunces + Inter), aislada del panel
 * de administración: solo se aplica dentro de /(public).
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${fraunces.variable} ${inter.variable} font-(family-name:--font-body)`}
    >
      {children}
    </div>
  );
}
