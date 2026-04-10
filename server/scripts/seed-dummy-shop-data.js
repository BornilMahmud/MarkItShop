const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const prisma = require('../utills/db');

const categoriesToCreate = [
  'Smart Phones',
  'Laptops',
  'Headphones',
  'Smart Watches',
  'Cameras',
];

const dummyProducts = [
  {
    title: 'Samsung Galaxy A55',
    slug: 'samsung-galaxy-a55',
    manufacturer: 'Samsung',
    description: 'Mid-range phone with AMOLED display and all-day battery.',
    price: 45990,
    inStock: 20,
    categoryName: 'Smart Phones',
    mainImage: 'https://picsum.photos/seed/galaxy-a55/800/800',
  },
  {
    title: 'Xiaomi Redmi Note 14',
    slug: 'xiaomi-redmi-note-14',
    manufacturer: 'Xiaomi',
    description: 'High value smartphone with fast charging and smooth display.',
    price: 29990,
    inStock: 30,
    categoryName: 'Smart Phones',
    mainImage: 'https://picsum.photos/seed/redmi-note-14/800/800',
  },
  {
    title: 'ASUS Vivobook 15',
    slug: 'asus-vivobook-15',
    manufacturer: 'ASUS',
    description: 'Reliable daily-use laptop for office work and study.',
    price: 68990,
    inStock: 12,
    categoryName: 'Laptops',
    mainImage: 'https://picsum.photos/seed/vivobook-15/800/800',
  },
  {
    title: 'Sony WH-CH720N',
    slug: 'sony-wh-ch720n',
    manufacturer: 'Sony',
    description: 'Noise cancelling wireless headphones with balanced sound.',
    price: 16990,
    inStock: 16,
    categoryName: 'Headphones',
    mainImage: 'https://picsum.photos/seed/wh-ch720n/800/800',
  },
  {
    title: 'Amazfit GTR Mini',
    slug: 'amazfit-gtr-mini',
    manufacturer: 'Amazfit',
    description: 'Compact smartwatch with fitness tracking and long battery.',
    price: 10990,
    inStock: 25,
    categoryName: 'Smart Watches',
    mainImage: 'https://picsum.photos/seed/amazfit-gtr-mini/800/800',
  },
  {
    title: 'Canon EOS R50',
    slug: 'canon-eos-r50',
    manufacturer: 'Canon',
    description: 'Entry-level mirrorless camera for content creators.',
    price: 102990,
    inStock: 6,
    categoryName: 'Cameras',
    mainImage: 'https://picsum.photos/seed/canon-r50/800/800',
  },
];

async function seed() {
  try {
    let merchant = await prisma.merchant.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });

    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          name: 'Default Merchant',
          description: 'Auto-created merchant for demo products',
          email: 'merchant@example.com',
          phone: '01700000000',
          address: 'Dhaka, Bangladesh',
          status: 'ACTIVE',
        },
      });
    }

    const categoryMap = new Map();

    for (const categoryName of categoriesToCreate) {
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
      });
      categoryMap.set(categoryName, category.id);
    }

    for (const product of dummyProducts) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          title: product.title,
          manufacturer: product.manufacturer,
          description: product.description,
          price: product.price,
          inStock: product.inStock,
          mainImage: product.mainImage,
          categoryId: categoryMap.get(product.categoryName),
          merchantId: merchant.id,
        },
        create: {
          title: product.title,
          slug: product.slug,
          manufacturer: product.manufacturer,
          description: product.description,
          price: product.price,
          inStock: product.inStock,
          rating: 5,
          mainImage: product.mainImage,
          categoryId: categoryMap.get(product.categoryName),
          merchantId: merchant.id,
        },
      });
    }

    console.log('Dummy categories and products seeded successfully.');
  } catch (error) {
    console.error('Failed to seed dummy data:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
