import express from 'express';
import fs from 'fs';
import { exec } from 'child_process';

const app = express();
const PORT = 3001;

app.get('/scrape-deals', (req, res) => {
    // Exécute le script de scraping
    exec('node dealLabsAPI.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur de scraping: ${error.message}`);
            return res.status(500).json({ success: false, message: 'Erreur de scraping' });
        }
        if (stderr) console.error(`stderr: ${stderr}`);

        // Lire le fichier mis à jour
        fs.readFile('lego_deals.json', 'utf8', (err, data) => {
            if (err) {
                console.error('Erreur de lecture du fichier:', err);
                return res.status(500).json({ success: false, message: 'Erreur de lecture des deals' });
            }
            res.json({ success: true, data: JSON.parse(data) });
        });
    });
});

app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
