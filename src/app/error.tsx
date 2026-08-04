"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">Error</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Algo salió mal
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ocurrió un error inesperado. Puedes intentar de nuevo; si persiste,
        vuelve en unos minutos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Intentar de nuevo
      </button>
    </main>
  );
}
