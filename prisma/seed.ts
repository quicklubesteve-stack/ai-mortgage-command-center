import { seedDatabaseIfEmpty } from "../src/lib/seed-helper";

async function main() {
  console.log("Seeding AI Mortgage Command Center demo database...");
  const result = await seedDatabaseIfEmpty(true);
  console.log(`Seed complete! Applications count: ${result.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
