import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  generateSimAccountName,
  generateSimActiveKey,
} from "../src/lib/hive/simKey";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const POOL_SIZE = Number(process.env.SEED_WALLET_POOL_SIZE ?? 20);
const EVENT_SLUG = process.env.ACTIVE_EVENT_SLUG ?? "chreschtmaart";

async function main() {
  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } });
  if (!event) {
    throw new Error(`Event "${EVENT_SLUG}" not found. Run: npm run db:seed`);
  }

  const existing = await prisma.customer_wallet.count({
    where: { event_id: event.id, status: "available" },
  });
  const toCreate = Math.max(0, POOL_SIZE - existing);

  let created = 0;
  for (let i = 0; i < toCreate; i++) {
    // Retry on the (rare) generated account-name collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const hiveAccount = generateSimAccountName();
      try {
        const account = await prisma.account.create({
          data: { hive_account: hiveAccount, display_name: "Customer wallet" },
        });
        await prisma.customer_wallet.create({
          data: {
            event_id: event.id,
            account_id: account.id,
            active_key: generateSimActiveKey(),
            status: "available",
          },
        });
        created++;
        break;
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
  }

  console.log(
    `Wallet pool for "${EVENT_SLUG}": ${existing} available before, ${created} created (target ${POOL_SIZE}).`,
  );
}

main()
  .catch((error) => {
    console.error("Wallet pool seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
