const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

const URL = 'https://www.dealabs.com/groupe/lego';

async function scrapeLegoDeals() {
    try {
        const response = await fetch(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.google.com/',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const body = await response.text();
        const $ = cheerio.load(body);
        let deals = [];
        
        $('.threadListCard').each((index, element) => {
            const title = $(element).find('.thread-title a.js-thread-title').text().trim();
            if (!title.toLowerCase().includes('lego')) return;

            const link = $(element).find('.thread-title a.js-thread-title').attr('href');
            const fullLink = link ? link : "Lien non disponible";

            const priceText = $(element).find('.thread-price').text().trim();
            const price = priceText ? parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.')) : null;

            const merchant = $(element).find('.threadListCard-body .color--text-AccentBrand').text().trim() || "Marchand inconnu";

            const image = $(element).find('.threadListCard-image').attr('src') || "Image non disponible";

            const author = $(element).find('.overflow--ellipsis.size--all-xs.size--fromW3-s').text().trim() || "Auteur inconnu";

            const temperature = $(element).find('span.overflow--wrap-off').text().trim() || "Température inconnue";

            deals.push({ title, price, link: fullLink, merchant, image, author, temperature });
        });
        
        fs.writeFileSync('lego_deals.json', JSON.stringify(deals, null, 2));
        console.log('Scraping terminé. Données sauvegardées dans lego_deals.json');
    } catch (error) {
        console.error('Erreur lors du scraping :', error);
    }
}

scrapeLegoDeals();
