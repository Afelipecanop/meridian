import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Protege /admin/* usando solo la configuración ligera (sin BD).
// El callback `authorized` de auth.config.ts decide el acceso.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*"],
};
