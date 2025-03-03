import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
 
dotenv.config({ path: './.env' });
console.log('Dotenv Loaded:', process.env.MONGODB_URI ? '✅ OK' : '❌ Not Loaded');

console.log('MONGODB_URI:', process.env.MONGODB_URI); // Debug

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

async function connectToMongoDB() {
  try {
    console.log('MONGODB_URI:', MONGODB_URI);

    const client = await MongoClient.connect(MONGODB_URI, {
      tls: true, 
      tlsAllowInvalidCertificates: true,
    });

    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const result = await collection.insertMany([]);
    console.log('Inserted:', result);

    await client.close();
    console.log('🚫 Connection closed');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}

connectToMongoDB();
