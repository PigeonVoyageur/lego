import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: './websites/.env' });

const PORT = 8092;
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

// Connexion à MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

let db;
let dealsCollection;
let salesCollection;

async function connectToMongoDB() {
  try {
    const client = await MongoClient.connect(MONGODB_URI, {});
    console.log('✅ Connected to MongoDB');
    
    db = client.db(MONGODB_DB_NAME);
    dealsCollection = db.collection('deals');
    salesCollection = db.collection('vintedSales');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
  

  
}

// Connecter à MongoDB avant de démarrer le serveur
connectToMongoDB();

// Route d'accueil
app.get('/', (req, res) => {
  res.send({ ack: true });
});

app.get('/deals/search', async (req, res) => {
  try {
    // Paramètres de requête avec valeurs par défaut
    const { limit = 12, price, date, filterBy, temperature, comments } = req.query;

    // Conversion du paramètre limit en entier
    const limitInt = parseInt(limit, 10);

    // Création du filtre MongoDB de base
    let filter = {};

    // Déterminer l'ordre de tri
    let sortCriteria = { price: 1 }; // Par défaut : tri croissant par prix

    if (filterBy === 'best-discount') {
      sortCriteria = { discount: -1 }; // Tri par réduction décroissante
    } else if (price === 'asc') {
      sortCriteria = { price: 1 }; // Tri croissant par prix
    } else if (price === 'desc') {
      sortCriteria = { price: -1 }; // Tri décroissant par prix
    } else if (date === 'asc') {
      sortCriteria = { published: 1 }; // Tri croissant par date
    } else if (date === 'desc') {
      sortCriteria = { published: -1 }; // Tri décroissant par date
    } else if (temperature === 'asc') {
      sortCriteria = { temperature: 1 }; // Tri croissant par température
    } else if (temperature === 'desc') {
      sortCriteria = { temperature: -1 }; // Tri décroissant par température
    } else if (comments === 'asc') {
      sortCriteria = { comments: 1 }; // Tri croissant par nombre de commentaires
    } else if (comments === 'desc') {
      sortCriteria = { comments: -1 }; // Tri décroissant par nombre de commentaires
    }

    // Recherche de deals avec tri appliqué
    const deals = await dealsCollection.find(filter).sort(sortCriteria).limit(limitInt).toArray();

    // Récupérer le total des résultats (sans limite)
    const total = await dealsCollection.countDocuments(filter);

    // Réponse JSON
    res.json({
      limit: limitInt,
      total,
      results: deals,
    });

  } catch (error) {
    console.error('❌ Error fetching deals:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// 🔍 Route pour rechercher un deal par ID (champ "id", pas "_id")
app.get('/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await dealsCollection.findOne({ id: id.toString() });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json(deal);
  } catch (error) {
    console.error('❌ Error fetching deal:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/sales/search', async (req, res) => {
  try {
    // 1️⃣ Extraction des paramètres de requête avec valeurs par défaut
    const { limit = 12, legoSetId } = req.query;
    const limitInt = parseInt(limit, 10);

    // 2️⃣ Création du filtre MongoDB
    let filter = {};
    if (legoSetId) {
      filter.id_lego = legoSetId;
    }

    // 3️⃣ Recherche dans la base avec filtre et tri par date décroissante
    let salesCursor = salesCollection.find(filter).sort({ published: -1 }).limit(limitInt);
    const sales = await salesCursor.toArray();

    // 4️⃣ Récupération du total des résultats correspondant au filtre
    const total = await salesCollection.countDocuments(filter);

    // 5️⃣ Réponse JSON formatée
    res.json({
      limit: limitInt,
      total,
      results: sales,
    });

  } catch (error) {
    console.error('❌ Error fetching sales:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(PORT, () => {
  console.log(`📡 Running on port ${PORT}`);
});

export default app;
