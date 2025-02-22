import puppeteer from 'puppeteer';
import fs from 'fs';

async function fetchCookies() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log("🌍 Connexion à Vinted...");
    await page.goto('https://www.vinted.fr', { waitUntil: 'networkidle2' });

    console.log("🔐 Connecte-toi manuellement, puis appuie sur ENTER ici quand c'est fait.");
    await new Promise(resolve => process.stdin.once('data', resolve));

    console.log("🍪 Récupération des cookies...");
    const cookies = await page.cookies();
    fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 4));

    console.log("✅ Cookies sauvegardés dans cookies.json !");
    await browser.close();
}

fetchCookies();
