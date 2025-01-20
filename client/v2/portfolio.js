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

   // Fonction pour formater la date
   const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000); // Conversion du timestamp en millisecondes
    return date.toLocaleDateString(); // Formatage de la date en fonction de la locale (JJ/MM/AAAA)
  };

  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price +'€'}</span>
        <span>${deal.discount ? deal.discount.toFixed(2) + '%' : 'N/A'}</span>
        <span>${deal.comments ? deal.comments + ' comments' : '0 comment'}</span>
        <span>${deal.temperature ? deal.temperature + '°C' : 'N/A'}</span>
        <span>Published: ${deal.published ? formatDate(deal.published) : 'N/A'}</span> <!-- Affichage de la date formatée -->
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
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