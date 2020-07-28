function buildMap() {
  // Global Variables //////////////////////////////////////////////////////////

  // Create the map, set the view Lat, Lon, and zoom level.
  var map = L.map('mapid').setView([37.06, -99.93], 4);

  // Set the domain and api endpoint for the path value.
  var domain = 'https://omeka.coloredconventions.org/';
  var endpoint = 'api/items';
  var path = domain + endpoint;

  // Set path to tile layer and path to tile layer attribution
  var tileLayerPath = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var tileCredits = 'https://www.openstreetmap.org/copyright';
  var tileTitle = 'Open Street Map';

  // Set perPage, the number of items Omeka API shows on a single page.
  var perPage = 50;
  
  // Closures //////////////////////////////////////////////////////////////////

  // Given that tileCredits and tileTitle are defined, returns HTML for map tile
  // attribution.
  function buildCredits() {
    return `&copy; <a href="${tileCredits}">${tileTitle}</a> contributors`;
  }

  // parseResponse takes a fetch response object and returns a JSON object.
  function parseResponse(response) {
    return response.json();
  }

  // plotData takes the results or data from the parsed fetch response object. 
  // For each item in the dataset, the function first locates the gps and title 
  // if they exist. Then, it plots the item on the map using its latitude, 
  // longitude, and title.
  function plotData(data) {
    // Set tester funcs to check if gps data exists or if title data exists.
    let isGps = (el) => el.element.id == 95;
    let isTitle = (el) => el.element.id == 50;

    // For each item in the set of data...
    for (const item of data) {
      // Grab the index of the element with gps and title data. Will be -1 if 
      // no index exists.
      let gpsIndex = item.element_texts.findIndex(isGps);
      let titleIndex = item.element_texts.findIndex(isTitle);

      // If the item has a gpsIndex and a titleIndex...
      if (gpsIndex != -1 && titleIndex != -1) {
        // Set gps string.
        let gps = item.element_texts[gpsIndex].text;
        // If the gps string does NOT contain "Smithsonian Instition" then...
        if (gps.indexOf("Smithsonian Institution") == -1) {
          // Build the url for the item.
          let itemId = item.id.toString();
          let itemUrl = domain + 'items/show/' + itemId;
          // Get Lat and Lon from the gps string and convert to a float.
          let lat = parseFloat(gps.split(',')[0]);
          let lon = parseFloat(gps.split(',')[1]);
          // Grab the title string.
          let itemTitle = item.element_texts[titleIndex].text;
          // Build the popup html
          let html = `<a href="${itemUrl}">${itemTitle}</a>`;

          // Place the marker on the map
          L.marker([lat, lon]).addTo(map).bindPopup(html);

        } else {
          // If item gps string contains "Smithsonian Institution," do nothing.
        }
      } else {
        // If item does not have gps metadata, do nothing.
      }
    }
  }

  // fetchPages takes a fetch response object, a parser function and a plotter 
  // function. Given that Omeka stores the total results of the api call in a 
  // header 'omeka-total-results', the function determines the total pages to 
  // pull from by dividing totalResults by perPage. The function then fetches 
  // every page, using the given parser and plotter functions as callbacks.
  function fetchPages(response, parser, plotter) {
    // Get total number of results from initital response header.
    let totalResults = parseInt(response.headers.get('omeka-total-results'));
    // Given the totalResults, find the totalPages.
    let totalPages = (Math.ceil(totalResults / perPage));
    // Grab the response url for the base of the new fetch call urls.
    let responseUrl = response.url;
    // Set page to = 1 to begin fetching from the first page.
    let page = 1;

    // While page is less than or equal to totalPages...
    do {
      // Build the page url.
      let url = responseUrl + '?page=' + page.toString();
      // Fetch the page using the given parser and plotter functions.
      fetch(url).then(parser).then(plotter);
      // Increment page by 1.
      page++;
      // Stop the loop when page is greater than totalPages.
    } while (page <= totalPages);
  }

  // popMap takes a url, and returns map markers for all Omeka items with gps 
  // metadata. (Note right now the URL needs to be an api endpoint of the form 
  // api/request, without additional filters like '?page='). It calls the 
  // fetchPages function in its callback, giving it parseResponse and plotData 
  // as its parser and plotter respectively. 
  function popMap(url) {
    fetch(url).then(function(response) {
      fetchPages(response, parseResponse, plotData);
    });
  }
  
  // Function Body /////////////////////////////////////////////////////////////

  // Set the tile layer and attribution.
  L.tileLayer(tileLayerPath, {
    attribution: buildCredits()
  }).addTo(map);

  // Populate the map with Omeka items!
  popMap(path)
}

buildMap()