import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Reutiliza la conexión entre recargas en desarrollo para no agotar
// el pool del Postgres gestionado (Neon/Supabase).
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL!, {
    // Compatible con PgBouncer (Supabase) y serverless (Neon).
    prepare: false,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
