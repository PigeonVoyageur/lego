import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * Vérifie si le fichier cookies.json existe et le charge.
 * S'il n'existe pas, il lance Puppeteer pour récupérer les cookies.
 */
async function getCookies() {
    if (fs.existsSync("cookies.json")) {
        console.log("🍪 Chargement des cookies existants...");
        return JSON.parse(fs.readFileSync("cookies.json", "utf8"))
            .map(c => `${c.name}=${c.value}`).join("; ");
    }

    console.log("🚀 Aucun cookie trouvé. Lancement de Puppeteer...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log("🌍 Connexion à Vinted...");
    await page.goto('https://www.vinted.fr', { waitUntil: 'networkidle2' });

    console.log("🔐 Connecte-toi manuellement, puis appuie sur ENTER ici quand c'est fait.");
    await new Promise(resolve => process.stdin.once('data', resolve));

    console.log("🍪 Récupération des cookies...");
    const cookies = await page.cookies();
    fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 4));

    console.log("✅ Cookies sauvegardés !");
    await browser.close();

    return cookies.map(c => `${c.name}=${c.value}`).join("; ");
}

/**
 * Scrappe les annonces Vinted via l'API interne
 * @param {string} legosetid - ID LEGO à rechercher (ex: "42182")
 */
async function getVintedDeals(legosetid) {
    const url = `https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=${legosetid}&brand_ids[]=89162&status_ids=1&order=newest_first`;
    const cookies = await getCookies(); // Récupère les cookies automatiquement

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "fr-FR,fr;q=0.9",
                "Referer": "https://www.vinted.fr/",
                "Origin": "https://www.vinted.fr",
                "Connection": "keep-alive",
                "Host": "www.vinted.fr",
                "X-Requested-With": "XMLHttpRequest",
                "X-Vinted-Locale": "fr_FR",
                "X-Request-ID": Math.random().toString(36).substring(7),
                "Cookie": cookies,            
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
                status: item.status || "Non spécifié",
                brand: item.brand_title || "Non spécifiée",
                seller: {
                    username: item.user.login,
                    profile_url: item.user.profile_url
                },
                link: `https://www.vinted.fr${item.path}`,
                image: item.photo?.url || "Pas d'image"
            }));

        if (deals.length === 0) {
            console.log("🚨 Aucun résultat LEGO trouvé !");
            return;
        }

        fs.writeFileSync("vinted_sales.json", JSON.stringify(deals, null, 4));
        console.log("✅ Données LEGO sauvegardées dans vinted_sales.json !");
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des annonces:", error);
    }
}

// Exécute le scraping pour un legosetid donné (ex: 42182)
const legosetid = process.argv[2] || "42182";
getVintedDeals(legosetid);
