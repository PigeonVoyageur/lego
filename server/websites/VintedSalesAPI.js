import fetch from 'node-fetch';
import fs from 'fs';

const COOKIE_FILE = "cookies.json";

/**
 * Récupère les cookies automatiquement depuis l'API Vinted
 */
async function getCookies() {
    if (fs.existsSync(COOKIE_FILE)) {
        console.log("🍪 Chargement des cookies existants...");
        const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, "utf8"));
        return cookies.join("; ");
    }

    console.log("🚀 Génération automatique des cookies...");
    const response = await fetch("https://www.vinted.fr", {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "fr-FR,fr;q=0.9"
        }
    });

    const rawCookies = response.headers.raw()["set-cookie"];
    const cookies = rawCookies.map(c => c.split(";")[0]);
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 4));

    console.log("✅ Cookies sauvegardés !");
    return cookies.join("; ");
}

/**
 * Formate la date à partir d'un timestamp UNIX.
 */
function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/**
 * Scrappe automatiquement les annonces LEGO
 */
async function getVintedDeals(legosetid) {
    fs.writeFileSync("vinted_sales.json", JSON.stringify([], null, 4));
    const url = `https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=${legosetid}&brand_ids[]=89162&catalog_item_condition_ids=1,2&order=newest_first`;
    const cookies = await getCookies();

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "X-Vinted-Locale": "fr_FR",
                "Cookie": cookies
            }
        });

        if (response.status === 401) {
            console.log("🔄 Cookies expirés... Régénération...");
            fs.unlinkSync(COOKIE_FILE);
            return getVintedDeals(legosetid);
        }

        if (!response.ok) {
            throw new Error(`❌ HTTP ${response.status}`);
        }

        const json = await response.json();
        if (!json.items || json.items.length === 0) {
            console.log("❌ Aucune annonce trouvée pour cet ID LEGO.");
            return;
        }

        const deals = json.items.map(item => ({
            id: item.id,
            title: item.title,
            price: `${item.price.amount} ${item.price.currency_code}`,
            //published: (item.updatedAt_ts),
            seller: {
                username: item.user.login,
                profile_url: item.user.profile_url
            },
            link: `https://www.vinted.fr${item.path}`,
            image: item.photo?.url || "Pas d'image",
            favorites_count: item.favourite_count || 0,
            id_lego: SearchIdinTitle(item.title) // Extraction de l'ID LEGO depuis le titre
        }));
        fs.writeFileSync("vinted_sales.json", JSON.stringify(deals, null, 4));
        console.log("✅ Données LEGO sauvegardées !");
    } catch (error) {
        console.error("❌ Erreur :", error.message);
    }
}

function SearchIdinTitle(title) {
    const match = title.match(/\b\d{5}\b/); // Cherche un nombre de 5 chiffres
    return match ? match[0] : null; // Retourne l'ID ou null si non trouvé
}

const legosetid = process.argv[2] || "42182";
getVintedDeals(legosetid);
