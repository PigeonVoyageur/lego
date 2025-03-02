import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * Vérifie si le fichier cookies.json existe et charge les cookies.
 * S'il n'existe pas, utilise Puppeteer pour se connecter manuellement et récupérer les cookies.
 * @returns {Promise<string>} - Chaîne de cookies pour les requêtes HTTP.
 */
async function getCookies() {
    if (fs.existsSync("cookies.json")) {
        console.log("🍪 Chargement des cookies existants...");
        const cookies = JSON.parse(fs.readFileSync("cookies.json", "utf8"));
        return cookies.map(c => `${c.name}=${c.value}`).join("; ");
    }

    console.log("🚀 Aucun cookie trouvé. Lancement de Puppeteer...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log("🌍 Connexion à Vinted...");
    await page.goto('https://www.vinted.fr', { waitUntil: 'networkidle2' });

    console.log("🔐 Veuillez vous connecter manuellement, puis appuyez sur ENTER ici une fois la connexion effectuée.");
    await new Promise(resolve => process.stdin.once('data', resolve));

    console.log("🍪 Récupération des cookies...");
    const cookies = await page.cookies();
    fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 4));

    console.log("✅ Cookies sauvegardés dans cookies.json !");
    await browser.close();

    return cookies.map(c => `${c.name}=${c.value}`).join("; ");
}

/**
 * Formate la date à partir d'un timestamp UNIX.
 * @param {number} timestamp - Timestamp UNIX.
 * @returns {string} - Date formatée.
 */
function formatDate(timestamp) {
    if (!timestamp) return "Non spécifiée";
    return new Date(timestamp * 1000).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/**
 * Scrappe les annonces Vinted pour des produits LEGO via l'API interne.
 * @param {string} legosetid - ID LEGO à rechercher.
 */
async function getVintedDeals(legosetid) {
    const url = `https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=${legosetid}&brand_ids[]=89162&status_ids=1&order=newest_first`;
    const cookies = await getCookies(); // Appel de la fonction pour obtenir les cookies

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "fr-FR,fr;q=0.9",
                "Referer": "https://www.vinted.fr/",
                "X-Vinted-Locale": "fr_FR",
                "Cookie": cookies
            }
        });

        if (!response.ok) {
            throw new Error(`❌ Erreur HTTP : ${response.status}`);
        }

        const json = await response.json();
        if (!json.items || json.items.length === 0) {
            console.log("❌ Aucune annonce trouvée pour cet ID LEGO.");
            return;
        }

        const deals = json.items
            .filter(item => item.brand_title?.toLowerCase() === "lego")
            .map(item => ({
                id: item.id,
                title: item.title,
                price: `${item.price.amount} ${item.price.currency_code}`,
                published: formatDate(item.created_at_ts),
                seller: {
                    username: item.user.login,
                    profile_url: item.user.profile_url
                },
                link: `https://www.vinted.fr${item.path}`,
                image: item.photo?.url || "Pas d'image",
                favorites_count: item.favourite_count || 0,
                views: item.view_count || 0
            }));

        if (deals.length === 0) {
            console.log("🚨 Aucun résultat LEGO trouvé !");
            return;
        }

        fs.writeFileSync("vinted_sales.json", JSON.stringify(deals, null, 4));
        console.log("✅ Données LEGO sauvegardées dans vinted_sales.json !");
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des annonces :", error);
    }
}

const legosetid = process.argv[2] || "42182";
getVintedDeals(legosetid);
