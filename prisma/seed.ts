import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  ProductStatus,
  ProductType,
} from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  const release = await prisma.release.upsert({
  where: {
    slug: "draco-dormiens-release",
  },
  update: {},
  create: {
    title: "Draco Dormiens",
    slug: "draco-dormiens-release",
    preorderPrice: 1500,
    finalPrice: null,
    preorderOpen: true,
    finalPaymentOpen: false,
    deliveryOpen: false,
  },
});

  const book = await prisma.product.create({
    data: {
      releaseId: release.id,
      type: ProductType.BOOK,
      title: "Draco Dormiens",
      slug: "draco-dormiens",
      fandom: "Harry Potter",
      author: "Автор проекта",
      betaOrTranslator: "Редактор",
      pairing: "Dramione",
      rating: "NC-17",
      tags: "hurt/comfort, slow burn, angst",
      pagesCount: 640,
      tomesCount: 2,
      description:
        "Коллекционное двухтомное издание фанфика с премиальным оформлением и дополнительными материалами.",
      finalPrice: 4200,
      minPrintRun: 50,
      status: ProductStatus.APPLICATIONS_OPEN,
      images: {
        create: [
          {
            imageUrl: "https://placehold.co/900x1200/png",
            sortOrder: 0,
            altText: "Обложка товара",
            isCover: true,
          },
          {
            imageUrl: "https://placehold.co/900x1200/png?text=Art+1",
            sortOrder: 1,
            altText: "Арт 1",
          },
          {
            imageUrl: "https://placehold.co/900x1200/png?text=Art+2",
            sortOrder: 2,
            altText: "Арт 2",
          },
        ],
      },
    },
    include: {
      images: true,
    },
  });

  const merch = await prisma.product.create({
    data: {
      type: ProductType.MERCH,
      title: "Набор карточек Draco Dormiens",
      slug: "draco-dormiens-cards",
      fandom: "Harry Potter",
      description:
        "Лимитированный набор карточек по оформлению релиза. Может приобретаться отдельно.",
      finalPrice: 900,
      status: ProductStatus.APPLICATIONS_OPEN,
      images: {
        create: [
          {
            imageUrl: "https://placehold.co/900x1200/png?text=Merch",
            sortOrder: 0,
            altText: "Набор карточек",
            isCover: true,
          },
        ],
      },
    },
    include: {
      images: true,
    },
  });

  const adminUser = await prisma.user.upsert({
  where: {
    email: "admin@example.com",
  },
  update: {
    isAdmin: true,
  },
  create: {
    name: "Admin",
    email: "admin@example.com",
    passwordHash: "test_hash_here",
    isAdmin: true,
  },
});

  console.log("Seed completed:", {
    book: book.title,
    merch: merch.title,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
