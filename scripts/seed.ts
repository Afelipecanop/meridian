import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { hash } from "bcryptjs";
import { users } from "../src/db/schema";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@meridian.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin1234";
  const name = process.env.ADMIN_NAME ?? "Admin";

  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  const db = drizzle(client);

  const passwordHash = await hash(password, 10);

  const existing = await db.select().from(users).where(eq(users.email, email));

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ passwordHash, name })
      .where(eq(users.email, email));
    console.log(`Usuario admin actualizado: ${email}`);
  } else {
    await db.insert(users).values({ email, passwordHash, name });
    console.log(`Usuario admin creado: ${email}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
