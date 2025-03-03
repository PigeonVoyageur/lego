import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config({ path: './.env' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Fix SSL Windows

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

async function connectToMongoDB() {
  try {
    const client = await MongoClient.connect(MONGODB_URI, {});

    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB_NAME);

    await importDeals(db);
    await importVintedSales(db);

    //await findBestDiscountDeals(db);
    //await findMostCommentedDeals(db);
    await findDealsSortedByPrice(db);
    //await findDealsSortedByDate(db);
    await findSalesByLegoSetId(db, '75403');
    //await findSalesScrapedLessThanThreeWeeks(db);

    await client.close();
    console.log('🚫 Connection closed');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}

async function importDeals(db) {

  const collection = db.collection('deals');

  try {
    const data = await fs.readFile('./lego_deals.json', 'utf-8');
    const deals = JSON.parse(data);

    console.log(`🔥 ${deals.length} deals trouvés`);

    // 1. Reset des anciennes données
    await collection.dropIndexes().catch(() => {});
    console.log('🛑 Index supprimé');

    await collection.deleteMany({});
    console.log('🧹 Anciennes données supprimées');

    // 2. Filtrer les deals sans publication
    const validDeals = deals.filter((deal) => deal.publication);
    console.log(`✅ ${validDeals.length} deals valides`);

    // 3. Insérer les deals
    const result = await collection.insertMany(validDeals, { ordered: false });
    console.log(`✅ ${result.insertedCount} nouveaux deals importés`);

    // 4. Créer l'index unique sur la publication
    await collection.createIndex({ publication: 1 }, { unique: true });
    console.log('🔑 Index unique sur "publication" créé');
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`⚠️ Duplication ignorée pour:`, err.keyValue);
    } else {
      console.error('❌ Erreur lors de l\'importation:', err);
    }
}
}

async function importVintedSales(db) {
  

  const collection = db.collection('vintedSales');

  try {
    const data = await fs.readFile('./vinted_sales.json', 'utf-8');
    const sales = JSON.parse(data);

    console.log(`🔥 ${sales.length} ventes trouvées`);

    await collection.dropIndexes().catch(() => {});
    console.log('🛑 Index supprimé');

    await collection.deleteMany({});
    console.log('🧹 Anciennes données supprimées');

    const result = await collection.insertMany(sales, { ordered: false });
    console.log(`✅ ${result.insertedCount} nouvelles ventes importées`);

    await collection.createIndex({ id: 1 }, { unique: true });
    console.log('🔑 Index unique sur "id" créé');
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`⚠️ Duplication ignorée pour:`, err.keyValue);
    } else {
      console.error('❌ Erreur lors de l\'importation:', err);
    }
  }
}

// Le but ici est de faire en sorte que les N/A se retrouvent à la fin du classement et non au début par défaut
async function findBestDiscountDeals(db) {
  const collection = db.collection('deals');
  const deals = await collection.aggregate([
    {
      $addFields: {
        discountValue: {
          $cond: {
            if: { $eq: ['$discount', 'N/A'] },
            then: -Infinity,
            else: '$discount',
          },
        },
      },
    },
    { $sort: { discountValue: -1 } },
    {
      $project: { discountValue: 0 },
    },
  ]).toArray();
  console.log('🏆 Meilleurs deals par réduction:', deals);
}

async function findMostCommentedDeals(db) {
  const collection = db.collection('deals');
  const deals = await collection.find().sort({ comments: -1 }).toArray();
  console.log('💬 Deals les plus commentés:', deals);
}

async function findDealsSortedByPrice(db) {
  const collection = db.collection('deals');
  const deals = await collection.aggregate([
    {
      $addFields: {
        priceValue: {
          $cond: {
            if: { $eq: ['$price', 0] },
            then: Infinity,
            else: '$price',
          },
        },
      },
    },
    { $sort: { priceValue: 1 } },
    {
      $project: { priceValue: 0 },
    },
  ]).toArray();
  console.log('💰 Deals triés par prix:', deals);
}

async function findDealsSortedByDate(db) {
  const collection = db.collection('deals');
  const deals = await collection.find().sort({ publication: -1 }).toArray();
  console.log('📅 Deals triés par date:', deals);
}

async function findSalesByLegoSetId(db, legoSetId) {
  const collection = db.collection('vintedSales');
  const sales = await collection.find({ id: parseInt(legoSetId) }).toArray();
  console.log(`🔍 Ventes pour le set LEGO ${legoSetId}:`, sales);
}

async function findSalesScrapedLessThanThreeWeeks(db) {
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  const collection = db.collection('vintedSales');
  const sales = await collection.find({ publication: { $gte: threeWeeksAgo.getTime() / 1000 } }).toArray();
  console.log('🕒 Ventes moins de 3 semaines:', sales);
}

connectToMongoDB();

