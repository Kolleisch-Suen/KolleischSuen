import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const eventSeeds = [
  {
    slug: "chreschtmaart",
    name: "Chrëschtmaart",
  },
  {
    slug: "kolleisch-in-concert-winter",
    name: "Kolléisch in Concert - Winter",
  },
  {
    slug: "open-day",
    name: "Open Day",
  },
  {
    slug: "charity-run",
    name: "Charity Run",
  },
  {
    slug: "kolleisch-in-concert-summer",
    name: "Kolléisch in Concert - Summer",
  },
];

const boothSeeds = [
  {
    name: "Nourriture",
    hiveAccount: process.env.SEED_FOOD_ACCOUNT ?? "ksuen-food",
    sortOrder: 1,
  },
  {
    name: "Boissons",
    hiveAccount: process.env.SEED_DRINKS_ACCOUNT ?? "ksuen-drinks",
    sortOrder: 2,
  },
  {
    name: "Crémant",
    hiveAccount: process.env.SEED_CREMANT_ACCOUNT ?? "ksuen-cremant",
    sortOrder: 3,
  },
];

async function main() {
  const tokenSymbol = process.env.SEED_TOKEN_SYMBOL ?? "TOKEN";
  const cashierHiveAccount =
    process.env.SEED_CASHIER_ACCOUNT ?? "ksuen-cashier";

  const cashierAccount = await prisma.account.upsert({
    where: { hive_account: cashierHiveAccount },
    update: { display_name: "KolleischSuen cashier" },
    create: {
      hive_account: cashierHiveAccount,
      display_name: "KolleischSuen cashier",
    },
  });

  const boothAccountIds = new Map<string, string>();

  for (const boothSeed of boothSeeds) {
    const boothAccount = await prisma.account.upsert({
      where: { hive_account: boothSeed.hiveAccount },
      update: { display_name: boothSeed.name },
      create: {
        hive_account: boothSeed.hiveAccount,
        display_name: boothSeed.name,
      },
    });

    boothAccountIds.set(boothSeed.hiveAccount, boothAccount.id);
  }

  for (const eventSeed of eventSeeds) {
    const event = await prisma.event.upsert({
      where: { slug: eventSeed.slug },
      update: {
        name: eventSeed.name,
        token_symbol: tokenSymbol,
      },
      create: {
        ...eventSeed,
        token_symbol: tokenSymbol,
        is_active: false,
      },
    });

    await prisma.event_account.upsert({
      where: {
        event_id_account_id_role: {
          event_id: event.id,
          account_id: cashierAccount.id,
          role: "cashier",
        },
      },
      update: { is_active: true },
      create: {
        event_id: event.id,
        account_id: cashierAccount.id,
        role: "cashier",
        is_active: true,
      },
    });

    for (const boothSeed of boothSeeds) {
      const accountId = boothAccountIds.get(boothSeed.hiveAccount);

      if (!accountId) {
        throw new Error(`Missing seeded account for ${boothSeed.name}`);
      }

      await prisma.event_account.upsert({
        where: {
          event_id_account_id_role: {
            event_id: event.id,
            account_id: accountId,
            role: "vendor",
          },
        },
        update: { is_active: true },
        create: {
          event_id: event.id,
          account_id: accountId,
          role: "vendor",
          is_active: true,
        },
      });

      await prisma.booth.upsert({
        where: {
          event_id_name: {
            event_id: event.id,
            name: boothSeed.name,
          },
        },
        update: {
          account_id: accountId,
          sort_order: boothSeed.sortOrder,
          is_active: true,
        },
        create: {
          event_id: event.id,
          account_id: accountId,
          name: boothSeed.name,
          sort_order: boothSeed.sortOrder,
          is_active: true,
        },
      });
    }
  }

  console.log(
    `Seeded ${eventSeeds.length} events and ${boothSeeds.length} booths per event.`,
  );
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
