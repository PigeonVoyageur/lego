import fetch from 'node-fetch';
import fs from 'fs';

/**
 * Scrappe les annonces Vinted via l'API interne
 * @param {string} legosetid - ID LEGO à rechercher (ex: "42182")
 */
async function getVintedDeals(legosetid) {
    const url = `https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=${legosetid}&brand_ids[]=89162&status_ids=1&order=newest_first`;

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
                "Cookie": "_vinted_fr_session=azhvd0lTQjd2YVRhTnBwRytiM09RWWdrVUx6d2hhcG9ITUZNOXROaGEzNDNDTXFxbG9HRlg1OU5FSE5YSlMvMlNyTGhBaG0ycURKTzM3a1dWaHVZdWk5RnplRnpYcGxYNFFzbE1Majd5VmY5cjdYNnh6eld6bFcwaWg2bjFOejl5bGZjbGMrMXZHdUkwWi82aXUxME9nSTZLNDNNazZoZnNrWDloZlFUVlhuQzZUOUloMW9yZlowZEVVL0F4TjljL0lISWFSOGwyQkF0NHlrVWpqQW1PTXN3aHRmL0FaVWt4MWJoYXRUU2FNVDVXTEtMSDJ3cnZIK1duWlBLQjBiby0tcUZId01SR2JqeXQ5dzcwS251R21XQT09--211e6afec3d2e3319546b7b6156c09963a295850--e630ff35947ffc89db2a66fa95069ec9efbf8f74;"+
                "__cf_bm=.jCGTvJXqh7fzv1QPfth0MfCIc75ydGSxEsubMFuzbY-1739178068-1.0.1.1-kKNUVN3GtOfVHcJ7VuEch2aa6DiU15gE0sXzkvgCh0F0FX5zrAXTIn3OMD88O5eirJHaJxc5OQg7XoSfFpP_JJXtfiqN_ZcbO14KnkuIKF8;" + 
                "access_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhcHBfaWQiOjQsImNsaWVudF9pZCI6IndlYiIsImF1ZCI6ImZyLmNvcmUuYXBpIiwiaWF0IjoxNzM5MTc0MDQzLCJzaWQiOiJjNWI2OGJkMS0xNzM4NTkxMjc5Iiwic2NvcGUiOiJwdWJsaWMiLCJleHAiOjE3MzkxODEyNDMsInB1cnBvc2UiOiJhY2Nlc3MifQ.kc0Ukm8Vlz2ALlm50B0iVfHMEUGFfImC-Kd3askdAKlqwvOn_XICrxYBbvyGW57tKGqWUh5Xk8vCyHkolIzn4Zwy61ZYiVGO8o9j0OA_Mta8jR6pl_Tae3f-4Dq-vhLD3X_ls87IuOf9rY8PAmH4JR9cdgQwerlqvPuTP7aGvqRuNiDhCmRm6_JnR8ejQii6IW0zx9BlOGCXUL8JZzAsqHP8e8hvr1ecA7rokCPYBmjwFcLMwnkI6gzU5DipkBqGbCGVfy7VW1AsgZ5a1J2l6ntQJAQFqXyfhCfqm0gLn6O7L0wd_-6qtdZl1ec5B2r0FfojS6SqwCPsZuzritBb9g;"+
                "cf_clearance=9lH0qdjZH4k7klL7c98DpoWTXgErGIhekG5b9qEjU2g-1739179681-1.2.1.1-GZt7MrcIm7EYdrtQL.3Fbtqy0I4PgOY_WLQEn7ECbCt2MEm5vwkafGUGUbiDphkm6.coxC7pXvOgHFVy_PBYzNHo0cJT1hyLh4ZTC2acZDddhX04Tzhgpmd5jnpWlySiHNl_Io3eHlHy2XDvygxkOad20F.VAIwN_YzXa9ZWGdkn2y1uAsygwUfHHxX0SNXewm76taRZOZndz_Ws_eWaO1RY6TwvlECZw9qxmMpXTPVBao8ZvEaQ.3cHb8HNqwaC.SKeIg5T7UThdCI8d9Sx7xdygK_kKaHGszmsjVjRdz0;"+
                "datadome=N5CF2z0HviCDY7DnbgC2F0fxWvQpe3yoOCKm~e3Napv7SWiSEXQ7Q1wdj72R3y7OuTsj2EcnSc6IRz2R4kTzi7xExGrZle1BjgJAUw0b7d9SWR2lDCyyMqgn_srAppav;"+
                "refresh_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhcHBfaWQiOjQsImNsaWVudF9pZCI6IndlYiIsImF1ZCI6ImZyLmNvcmUuYXBpIiwiaWF0IjoxNzM5MTc0MDQzLCJzaWQiOiJjNWI2OGJkMS0xNzM4NTkxMjc5Iiwic2NvcGUiOiJwdWJsaWMiLCJleHAiOjE3Mzk3Nzg4NDMsInB1cnBvc2UiOiJyZWZyZXNoIn0.IazWKytA_2_28JdxD9TzrC-_74AZk-j1X87MuPKdYEbLhY_sXaWcfjNFebmBUJF9M9HoMtxsJNIsavTSROSoqNAv_ikZEHD6rF25lBrQZK22rKiUCa3jsES-Gywz8EiWPTWpmBh2iKNUPL2-sE0shO7O76N0hWlowzZXMnFPumHqyLr-mCict-POsUAJugD3cg-4i3QVeUP6YMrvpy8e5MgnHaysfrgg9lTJ2xHUbetwnIOX1RybiK0514N0yotpKyytAj0felJFAOKmrl8Q9TwTCcZN7neHXkFrWJRPzg1IPZqMg7fCFAX95xghGASSyeTjVP6jzDpWF5w8mkdf_g;"+
                "v_sid=a8eda4d60760e2981fe1a963e42181ae;"+
                "v_udt=TWxCMXRLeDZaQ3F0cGc1VlZTTTFMQjhqWVBhNC0tNTNvVVRqbk5tUkdYUkkrMi0tVzBYS1dGWkFPSGRUWlJSM2ZmUVJVQT09"            
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

        // Vérifier si la marque est bien LEGO avant d'ajouter à la liste
        const deals = json.items
            .filter(item => item.brand_title?.toLowerCase() === "lego") // 🔥 Filtrage ici
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
            console.log("🚨 Les résultats ne correspondent pas à LEGO. Vérifie les filtres !");
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
