import fetch from 'node-fetch';
import fs from 'fs';

/**
 * Scrappe les annonces Vinted via l'API interne
 * @param {string} legosetid - ID LEGO à rechercher (ex: "42182")
 */
async function getVintedDeals(legosetid) {
    const url = `https://www.vinted.fr/api/v2/catalog/items?search_text=${legosetid}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.vinted.fr/',
                'Origin': 'https://www.vinted.fr',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Cookie': '__cf_bm=XXX; secure_session=YYY; other_cookie=ZZZ',
                'Connection': 'keep-alive'
            }
            
        });

        const json = await response.json();

        if (!json.items || json.items.length === 0) {
            console.log("❌ Aucune annonce trouvée pour cet ID LEGO.");
            return;
        }

        const deals = json.items.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price.amount + " " + item.price.currency_code,
            status: item.status || "Non spécifié",
            brand: item.brand_title || "Non spécifiée",
            seller: {
                username: item.user.login,
                profile_url: item.user.profile_url
            },
            link: "https://www.vinted.fr" + item.path,
            image: item.photo?.url || "Pas d'image"
        }));

        // Sauvegarde des résultats dans un fichier JSON
        fs.writeFileSync("vinted_sales.json", JSON.stringify(deals, null, 4));
        console.log("✅ Données sauvegardées dans vinted_sales.json !");
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des annonces:", error);
    }
}

// Exécute le scraping pour un legosetid donné (ex: 42182)
const legosetid = process.argv[2] || "42182";
getVintedDeals(legosetid);
