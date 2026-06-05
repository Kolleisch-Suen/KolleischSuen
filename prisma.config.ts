import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  datasource: {
    url: process.env.POSTGRES_URL!,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
