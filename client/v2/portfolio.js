// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const filterDiscountButton = document.querySelector('#filter-discount');
const filterMostCommentedButton = document.querySelector('#filter-most-commented');
const filterHotDealsButton = document.querySelector('#filter-hot-deals');
const selectSort = document.querySelector('#sort-select');
const selectSortDate = document.querySelector('#sort-select');
const inputLegoSetId = document.querySelector('#lego-set-id-select');


/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  // Fonction pour formater la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const template = deals
    .map(deal => {
      const isFavorite = favorites.some(fav => fav.uuid === deal.uuid);
      return `
        <div class="deal" id=${deal.uuid}>
          <img src="${deal.photo}" alt="${deal.title}" class="deal-image">
          <button class="favorite-btn" data-uuid="${deal.uuid}" aria-label="Add to favorites">
            ${isFavorite ? '❤️' : '🤍'}
          </button>
          <span class="deal-id">${deal.id}</span>
          <a href="${deal.link}" class="deal-title">${deal.title}</a>
          <span class="deal-price">${deal.price}€</span>
          <span class="deal-discount">${deal.discount ? deal.discount.toFixed(2) + '%' : 'N/A'}</span>
          <span class="deal-comments">${deal.comments ? deal.comments + ' comments' : '0 comment'}</span>
          <span class="deal-temperature">${deal.temperature ? deal.temperature + '°C' : 'N/A'}</span>
          <span class="deal-published">Published: ${deal.published ? formatDate(deal.published) : 'N/A'}</span>
        </div>
      `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
  console.log(document.querySelector("#deals").innerHTML);

  // Ajout des écouteurs d'événements pour les boutons de favoris
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const uuid = e.target.dataset.uuid;
      toggleFavorite(deals.find(deal => deal.uuid === uuid));
    });
  });
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const selectedPage = parseInt(event.target.value); //récupère la page sélectionnée
  const deals = await fetchDeals(selectedPage, currentPagination.pageSize); //fetch les deals de cette page
  setCurrentDeals(deals); //met à jour les données globales
  render(currentDeals, currentPagination); //met à jour l'affichage
})

const filterByDiscount = (deals) => {
  return deals.filter(deal =>deal.discount && deal.discount>50);
}

filterDiscountButton.addEventListener('click', async() => {
  const deals = await fetchDeals(currentPagination.currentPage, currentPagination.pageSize);
  const filteredDeals = filterByDiscount(deals.result);
  render(filteredDeals, currentPagination);
})

const filterByMostCommented = (deals) => {
  return deals.filter(deal => deal.comments && deal.comments >15 )
}
filterMostCommentedButton.addEventListener('click', async ()=>{
  const deals = await fetchDeals(currentPagination.currentPage, currentPagination.pageSize);
  const filteredDeals=filterByMostCommented(deals.result);
  render(filteredDeals,currentPagination);
})

 const filterByHotDeals = (deals) => {
  return deals.filter(deal => deal.temperature && deal.temperature>100);
 }
 filterHotDealsButton.addEventListener('click', async() =>{
  const deals = await fetchDeals(currentPagination.currentPage, currentPagination.pageSize);
  const filteredDeals=filterByHotDeals(deals.result);
  render(filteredDeals,currentPagination);
 })

 const sortByPrice = (deals, order = 'asc')=> {
  return deals.sort((a,b)=>{
    const priceA=a.price || 0; //Par précaution, on utilise 0 si le prix est absent
    const priceB = b.price || 0;
    if (order === 'asc')
    {
      return priceA-priceB;
    } else {
      return priceB - priceA;
    }
  });
 };
 selectSort.addEventListener('change', async (event) => {
  const selectedOrder = event.target.value;
  const deals = await fetchDeals(currentPagination.currentPage, currentPagination.pageSize);
  const sortedDeals = sortByPrice(deals.result, selectedOrder === 'price-asc' ? 'asc' : 'desc');
  render(sortedDeals, currentPagination);
 });

 const sortByDate = (deals, order = 'asc') => {
  return deals.sort((a,b)=>{
    const dateA =a.published || 0;
    const dateB = b.published || 0;
    if( order === 'asc'){
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
 };
 selectSortDate.addEventListener('change', async(event)=>{
  const selectedOrder = event.target.value;
  if(selectedOrder === 'date-asc' || selectedOrder === 'date-desc'){
    const deals = await fetchDeals(currentPagination.currentPage, currentPagination.pageSize);
    const sortedDeals = sortByDate(deals.result, selectedOrder === 'date-asc' ? 'asc' : 'desc');
    render(sortedDeals, currentPagination);
  }
 });

 /**
  * Fetch Vinted sales for a given LEGO set id
  * Nouvelle fonction pour récupérer les ventes Vinted pour un set LEGO donn
  * @param  {String} id - LEGO set id
  * @return {Array} - List of sales
  */
 const fetchSales = async (id) => {
  if (!id || id.trim() === '') {
    console.log('ID is empty');
    return { result: [] };
  }

  try {
    console.log(`Fetching sales for ID: ${id}`);
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);
    const body = await response.json();

    if (body.success !== true) {
      console.error('API Error:', body);
      return { result: [] };
    }

    console.log('Fetched sales:', body.data);
    return body.data; // This should be an object with a 'result' property
  } catch (error) {
    console.error('Fetch error:', error);
    return { result: [] };
  }
};


 /**
  * Affiche les ventes
  * Render Vinted Sales for a given LEGO set id
  * @param  {Array} sales - List of sales
  */
 const renderSales = (salesData) => {
  // Vérifier si salesData.result existe, sinon utiliser un tableau vide
  const salesArray = salesData.result || [];

  console.log('Sales to render:', salesArray); // Vérification des données reçues

  const sectionSales = document.querySelector('#vinted-sales-container');
  if (!sectionSales) {
      console.error("Erreur : Élément #vinted-sales-container introuvable.");
      return;
  }

  // Nettoyer le conteneur avant d'ajouter de nouvelles ventes
  sectionSales.innerHTML = '<h2></h2>';

  const fragment = document.createDocumentFragment();
  const div = document.createElement('div'); 
  div.classList.add("sales-grid"); // Ajout d'une classe pour un affichage en grille

  if (salesArray.length === 0) {
      div.innerHTML = '<p>Aucune vente disponible pour ce set.</p>';
  } else {
      const template = salesArray.map(sale => `
          <div class="sale">
              <img src="${sale.image ? sale.image : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrhIpYwqhQ6xdszbszIfFvukl__ZnyezImJA&s'}" alt="${sale.title || 'Aucune image'}">
              <h3><a href="${sale.link}" target="_blank">${sale.title}</a></h3>
              <p>Prix: ${sale.price ? sale.price + '€' : 'Non précisé'}</p>
              <span>Publié: ${new Date(sale.published).toLocaleDateString()}</span>
          </div>
      `).join('');

      div.innerHTML = template;
  }

  fragment.appendChild(div);
  sectionSales.appendChild(fragment);
};






/**
 * Evenement pour afficher les ventes
 */
selectLegoSetIds.addEventListener('change', async (event) => {
  const selectedSetId = event.target.value;
  if (!selectedSetId) return ; 
  const sales = await fetchSales(selectedSetId);
  renderSales(sales);
});

/**
 * FOnction pour rechercher les ventes dès que l'utilisateur change l'ID
 */
inputLegoSetId.addEventListener('input', async (event) => {
  const enteredId = event.target.value.trim(); // Récupère et nettoie l'ID entré
  console.log(enteredId);
  if (!enteredId) {
    // Si l'ID est vide, efface les résultats des ventes
    renderSales([]);
    return;
  }
  const sales = await fetchSales(enteredId); // Recherche les ventes pour cet ID
  console.log('Sales being passed to renderSales:', sales);
  renderSales(sales); // Affiche les ventes trouvées
});

/**
 * Fonction pour calculer la moyenne des prix
 * @param {Array} sales - Liste des ventes
 * @return {Number} - Moyenne des prix
 */
const calculateAveragePrice = (sales) => {
  if (sales.length === 0) {
    return 0;
  }
    const totalPrice = sales.reduce((sum, sale) => sum + parseFloat(sale.price), 0);
    return (totalPrice / sales.length).toFixed(2);
};

/**
 * Fonction pour calculer un percentile donné
 * @param {Array} sales - Liste des ventes
 * @param {Number} percentile - Valeur du percentile (5, 25, 50)
 * @return {Number} - Valeur du percentile
 */
const calculatePercentile = (sales, percentile) => {
  if (sales.length === 0) {
    return 0;
  }
  const sortedPrices = sales.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * sortedPrices.length);
  return sortedPrices[index] || 0;
}

/** 
 * Fonction pour calculer et afficher les indicateurs
 * @param {Array} sales - Liste des ventes
 */
const displayPriceIndicators = (sales) => {
  const averagePrice = calculateAveragePrice(sales);
  const p5Price = calculatePercentile(sales, 5);
  const p25Price = calculatePercentile(sales, 25);
  const p50Price = calculatePercentile(sales, 50);
  console.log('Indicators:', { averagePrice, p5Price, p25Price, p50Price, salesLength: sales.length });

  updateLifetimeValue(sales);
  // Update the DOM elements
  document.querySelector('#indicators #nbSales').textContent = sales.length;
  document.querySelector('#indicators #avg').textContent = sales.length ? `${averagePrice}€` : 'N/A';
  document.querySelector('#indicators #p5').textContent = sales.length ? `${p5Price}€` : 'N/A';
  document.querySelector('#indicators #p25').textContent = sales.length ? `${p25Price}€` : 'N/A';
  document.querySelector('#indicators #p50').textContent = sales.length ? `${p50Price}€` : 'N/A';
};

//Utilisation de la fonction dans le contexte de récupération des ventes
const fetchSalesAndDisplayIndicators = async (id) => {
  const salesData = await fetchSales(id);
  if (salesData && salesData.result && salesData.result.length > 0) {
    displayPriceIndicators(salesData.result);
  } else {
    console.log('Aucune vente disponible');
    // Optionally, reset the indicators to 0 or N/A
    displayPriceIndicators([]);
  }
};
//Ecouter l'événement sur l'input pour afficher les indicateurs
inputLegoSetId.addEventListener('input', async (event) => {
  const enteredId = event.target.value.trim();
  if (!enteredId) {
    return;
  }
  fetchSalesAndDisplayIndicators(enteredId);
});

/**
 * Calculate Lifetime value for a given set of sales
 * @param {Array} sales
 * @returns {string} Lifetime value in days
 */
const calculateLifetimeValue = (sales) => {
  if (!sales || sales.length === 0) {
    return 'No sales data';
  }

  // Convert all `published` dates to timestamps
  const dates = sales.map(sale => new Date(sale.published).getTime());

  // Find the earliest and latest dates
  const firstDate = Math.min(...dates); // First published
  const lastDate = Math.max(...dates);  // Last published

  // Calculate the difference in days
  const diffInMilliseconds = lastDate - firstDate;
  const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

  return `${diffInDays} days`;
};

/**
 * Update Lifetime value in the Indicators section
 * @param {Array} sales
 */
const updateLifetimeValue = (sales) => {
  const lifetimeElement = document.querySelector('#indicators #lifetime');
  const lifetimeValue = calculateLifetimeValue(sales);
  lifetimeElement.textContent = lifetimeValue;
  const lifetimeElementToday = document.querySelector('#indicators #lifetimeToday');
  const lifetimeValueToday = calculateLifetimeValueToday(sales);
  lifetimeElementToday.textContent = lifetimeValueToday;
};

// Example usage: Call this function after fetching sales for a given set ID
// updateLifetimeValue(fetchedSales);

const calculateLifetimeValueToday = (sales) => {
  if (!sales || sales.length === 0) {
    return 'No sales data';
  }

  // Convert all `published` dates to timestamps
  const dates = sales.map(sale => new Date(sale.published).getTime());

  // Find the earliest and latest dates
  const firstDate = Math.min(...dates); // First published
  const today = new Date().getTime(); // Today's date
  // Calculate the difference in days
  const diffInMilliseconds = today - firstDate;
  const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

  return `${diffInDays} days`;
};

/**
 * Toggle a deal in favorites
 * @param {Object} deal
 */
const toggleFavorite = (deal) => {
  console.log('Toggling favorite:', deal);
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  const existingIndex = favorites.findIndex(fav => fav.uuid === deal.uuid);
  if (existingIndex > -1) {
    // Remove from favorites
    favorites.splice(existingIndex, 1);
  } else {
    // Add to favorites
    favorites.push(deal);
  }

  // Update local storage
  localStorage.setItem('favorites', JSON.stringify(favorites));

  // Refresh deals display
  renderDeals(currentDeals, currentPagination);
};


//Ajout d'un gestionnaire d'événement pour ajouter des favoris
document.getElementById('filter-favorites').addEventListener('click', () => {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  renderDeals(favorites); // Affiche uniquement les favoris
});

//Stocker les deals actuels dans le local storage
const processSales = (sales) => {
  localStorage.setItem('currentDeals', JSON.stringify(sales)); // Stocke les ventes actuelles
  renderDeals(sales); // Affiche les ventes
};

