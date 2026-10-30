import { prisma } from "../src/lib/prisma.js";
import { runSeed } from "../src/seed/run-seed.js";

runSeed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
