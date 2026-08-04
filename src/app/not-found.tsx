import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Esta página no existe o ya no está publicada
      </h1>
      <Link href="/" className="mt-2 text-sm underline underline-offset-4">
        Ir al inicio
      </Link>
    </main>
  );
}
