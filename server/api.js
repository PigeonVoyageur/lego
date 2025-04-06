import cors from "cors";
import express from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// ⛏️ IMPORTS à ajouter tout en haut de api.js
import { getVintedDeals } from './websites/VintedSalesAPI.js';
import { connectToMongoDB } from './websites/db.js';


dotenv.config({ path: "./.env" });

const PORT = 8092;
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.options("*", cors());

// 🔹 Variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

// 🔹 Middleware pour gérer la connexion MongoDB à chaque requête
async function withMongoDB(callback, res) {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB_NAME);
    return await callback(db);
  } catch (error) {
    console.error("❌ MongoDB error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await client.close();
  }
}

// ✅ Route d'accueil
app.get("/", (req, res) => {
  res.send({ ack: true });
});

// ✅ Recherche de deals avec filtres, tri et pagination
app.get("/deals/search", async (req, res) => {
  await withMongoDB(async (db) => {
    const {
      limit = 12,
      page = 1,
      price,
      date,
      filterBy,
      temperature,
      comments
    } = req.query;

    const limitInt = parseInt(limit, 10);
    const pageInt = Math.max(parseInt(page, 10), 1); // Page minimum = 1
    const skip = (pageInt - 1) * limitInt;

    let filter = {};
    let sortCriteria = {};

    // 🔍 Application des filtres
    if (price) filter.price = { $lte: parseFloat(price) };
    if (date) filter.published = { $gte: new Date(date) };

    // 🔍 Application du tri
    if (filterBy === "best-discount") sortCriteria.discount = -1;
    else if (filterBy === "most-commented") sortCriteria.comments = -1;
    else if (filterBy === "cheapest") sortCriteria.price = 1;
    else if (temperature === "asc") sortCriteria.temperature = 1;
    else if (temperature === "desc") sortCriteria.temperature = -1;
    else if (comments === "asc") sortCriteria.comments = 1;
    else if (comments === "desc") sortCriteria.comments = -1;

    // 📦 Récupération paginée des résultats
    const deals = await db.collection("deals")
      .find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitInt)
      .toArray();

    const total = await db.collection("deals").countDocuments(filter);
    const totalPages = Math.ceil(total / limitInt);

    res.json({
      page: pageInt,
      limit: limitInt,
      total,
      totalPages,
      results: deals
    });
  }, res);
});


// ✅ Recherche d'un deal par ID
app.get("/deals/:id", async (req, res) => {
  await withMongoDB(async (db) => {
    const { id } = req.params;
    const deal = await db.collection("deals").findOne({ id: id.toString() });

    if (!deal) return res.status(404).json({ error: "Deal not found" });

    res.json(deal);
  }, res);
});

// ✅ Recherche de ventes avec filtrage
app.get("/sales/search", async (req, res) => {
  await withMongoDB(async (db) => {
    const { limit = 12, legoSetId } = req.query;
    const limitInt = parseInt(limit, 10);

    let filter = {};
    if (legoSetId) filter.id_lego = legoSetId;

    const sales = await db.collection("vintedSales").find(filter).sort({ published: -1 }).limit(limitInt).toArray();
    const total = await db.collection("vintedSales").countDocuments(filter);

    res.json({ limit: limitInt, total, results: sales });
  }, res);
});

// 🔄 Scrape Vinted + import dans MongoDB
app.get("/sales/fetch/:legoSetId", async (req, res) => {
  const { legoSetId } = req.params;

  if (!legoSetId || !/^\d{5}$/.test(legoSetId)) {
    return res.status(400).json({ error: "ID LEGO invalide (5 chiffres requis)" });
  }

  try {
    console.log(`🔎 Scraping Vinted pour le set #${legoSetId}...`);
    await getVintedDeals(legoSetId); // Étape 1 : scrap + écriture dans vinted_sales.json

    console.log("🛠️ Importation dans MongoDB...");
    await connectToMongoDB(); // Étape 2 : import des ventes depuis JSON vers Mongo

    res.status(200).json({ message: "✅ Ventes récupérées et importées avec succès !" });
  } catch (err) {
    console.error("❌ Erreur lors du fetch/import:", err);
    res.status(500).json({ error: "Erreur serveur lors du traitement des ventes" });
  }
});


// 🚀 Démarrage du serveur
app.listen(PORT, () => console.log(`📡 Server running on port ${PORT}`));

export default app;
