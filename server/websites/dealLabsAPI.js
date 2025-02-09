import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';

// Fonction pour extraire un ID LEGO (5 chiffres) depuis un titre
function SearchIdinTitle(title) {
    const match = title.match(/\b\d{5}\b/); // Cherche un nombre de 5 chiffres
    return match ? match[0] : null; // Retourne l'ID ou null si non trouvé
}

async function getLegoDeals() {
    const url = "https://www.dealabs.com/groupe/lego";

    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const body = await response.text();

    const $ = cheerio.load(body);
    const deals = [];

    $('div[data-vue2]').each((index, element) => {
        const jsonData = $(element).attr('data-vue2');
        if (jsonData) {
            try {
                const deal = JSON.parse(jsonData);
                const thread = deal.props.thread;

                deals.push({
                    title: thread.title,
                    price: thread.price,
                    nextBestPrice: thread.nextBestPrice,
                    discount: thread.nextBestPrice ? parseInt(((1 - thread.price / thread.nextBestPrice) * 100).toFixed(2),10) : "N/A",
                    temperature: thread.temperature,
                    merchant: thread.merchant.merchantName,
                    link: thread.link,
                    image: `https://static-pepper.dealabs.com/threads/raw/${thread.mainImage.uid}`,
                    publication: thread.publishedAt,
                    comments: thread.commentCount,
                    id: SearchIdinTitle(thread.title) // Extraction de l'ID LEGO depuis le titre
                });
            } catch (error) {
                console.error("Erreur de parsing JSON:", error);
            }
        }
    });

    // Écriture dans le fichier JSON
    fs.writeFile("lego_deals.json", JSON.stringify(deals, null, 4), (err) => {
        if (err) {
            console.error("Erreur lors de l'écriture du fichier:", err);
        } else {
            console.log("✅ Données sauvegardées dans lego_deals.json !");
        }
    });
}

getLegoDeals();
