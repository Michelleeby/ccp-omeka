// Script Name: omeka-classic-api-client
// Input: Takes an object, query, and a string, sort. 
// Authors: Michelle Byrnes
// Description: Fetches data from Omeka, parses it, and then sorts it according
// to a query and a sort parameter. 
// Version: 2.0

////////////////////////////////////////////////////////////////////////////////

// CONTENTS ////////////////////////////////////////////////////////////////////

// Sample Searches                  [ SAMPLES ]
// Version History                  [ VERSIONS ]
// Data and Closure Definitions     [ DEFINITIONS ]
// Explanation of Function Process  [ STEPS ]
// Global Declarations              [ GLOBALS ]
// Closures                         [ CLOSURES ]
// Function Body                    [ BODY ]

////////////////////////////////////////////////////////////////////////////////

// SAMPLES /////////////////////////////////////////////////////////////////////

// query is an object where each key/value pair represents a search field to  
// search in and the value to search for respectively. Each different field is 
// searched together using an AND statement if more than one field is provided. 
// See the possible query fields and sample searches below.

// Possible Query Fields:

// var query = {
//  range: 'YYYY-YYYY', 
//  state: 'SA' (State Abbreviation),
//		-> state also takes a list of state abbreviations like ['PA', 'TX']
//  city: 'City Name',
//  year: 'YYYY',
// }

// Sample Search: 

// Get all items between '1840-1860' AND with a state field equal to 'PA'
// var query = {
//  range: '1840-1860',
//  state: 'PA',
// }

// Get all items from Texas or Georgia
// var query = {
// state: ['TX', 'GA']
// }

// sort can be 'date', 'title', 'city', or 'state', it determines the order the 
// items will be sorted and displayed.

////////////////////////////////////////////////////////////////////////////////

function omekaClassicApiClient(query, sort) {
  // VERSIONS //////////////////////////////////////////////////////////////////

  // v1.0 : This version fetches, parses, and sorts data from Omeka Classic. It
  //        then injects each sorted item into a provided HTML element. (Using 
  //        the TITLE and URL properties of the item). It relies on hard coded 
  //        variables set in GLOBALS. Moreover, the query and sort parameter 
  //        are set in their respective functions, parseData and sortItems. 
  // v2.0 : TODO abstract variables, query, and sort parameter. Consider 
  //        removing HTML component from omekaClassicApiClient() and instead 
  //        have the function return the sorted array of queried items.

  //////////////////////////////////////////////////////////////////////////////

  // DEFINTIONS ////////////////////////////////////////////////////////////////

  // A RESPONSE is a raw FetchResponseObject of the Fetch API.

  // DATA is an ArrayOfObject, that is the parsed RESPONSE.

  // An ITEM is an Object of the form:
  //    { 
  //      id: Omeka item ID [NUM],
  //      url: Link to item page [STRING],
  //      title: Item title [STRING],
  //      date: Date in the form YYYY-MM-DD [STRING],
  //      year: Year in the form YYYY [STRING],
  //      month: Month in the form MM [STRING],
  //      day: Day in the form DD [STRING],
  //      city: City name [STRING],
  //      state: State abbreviation [STRING],
  //      country: Country abbreviation [STRING],
  //    }

  // ITEMS is an ArrayOfItem

  // A PAGE is a number that represents a page number.
  // PAGES is an ArrayOfNumber (or an ArrayOfPage).

  // parseData: data[ArrayOfObject] -> items[ArrayOfItem]
  // parseData takes an ArrayOfObject, data, as its input. Iterating over each 
  // item, first parseData sets all variable metadata fields to the default 
  // value. It then finds the index for each metadata element. If the index
  // exists for a specific field, it updates the item's field. Finally, if the
  // item meets a given condition, it builds an ITEM object and pushes this
  // object into the parsedItems array. The parsedItems variable is returned
  // once all data has been parsed. 

  // sortItems: items[ArrayOfItem] sortBy = 'String' -> items[ArrayOfItem]
  // sortItems takes an ArrayOfItem, items, and a String, sortBy as its input.
  // sortBy takes a default string, one of 'date', 'year', or 'title.' It then 
  // sorts items according to the sortBy parameter and returns this sorted list
  // of items. 

  // buildHtml: items[ArrayOfItem] -> Undefined 
  // This function takes an ArrayOfItem, items, as its input. It does
  // not return a value, instead this function injects HTML into a given HTML
  // element. For each item in the array, handleItems builds HTML for the item 
  // using its url and title, it stores this in the html variable. Then, 
  // buildHtml appends html to the given HTML element.

  // buildFetchRequests : response[FetchResponseObject] -> pages[ArrayOfNumber]
  // buildFetchRequests takes a FetchResponseObject, response, as its input.
  // Given that this response has the header 'omeka-total-results,' and given 
  // that perPage is defined, buildFetchRequests will calculate the number of
  // requests needed to fetch all items and store this as totalPages. It will
  // then build an array, pages, where each element is a number from 1 to 
  // totalPages. Finally, it returns the pages array.

  // fetchItems: pages[ArrayOfNumber] -> Undefined
  // fetchItems takes an ArrayOfNumber, pages, as its input. It iterates over 
  // pages, creating a fetch request for each page. These fetch requests are
  // executed and parsed in parrellel. The combined output data of each request
  // is stored in the data variable and fed to the parseData callback. Finally,
  // after the data is parsed and returned as an ArrayOfItem, it is fed into
  // handleItems callback. 

  //////////////////////////////////////////////////////////////////////////////

  // STEPS /////////////////////////////////////////////////////////////////////

  // 1.)  Send an initial fetch request using apiUrl, using buildFetchRequests
  // and fetchItems as callback functions. buildFetchRequests will create an 
  // array of numbers, where each number represents a page number to be 
  // fetched. (Omeka is set to only show 50 items per API request. To sift 
  // through all items, multiple fetch requests need to be made.) Once the 
  // array of numbers has been created, it is fed into the fetchItems callback. 

  // 2.)  The fetchItems function first fetches every page, it then feeds this
  // data into the parseData callback. The parseData callback iterates over
  // each item in the set of data. If the item matches a set condition, it adds 
  // it to the items array. The parseData function then returns the items array.

  // 3.)  Finally, the items are fed into the sortItems callback. It sorts the 
  // items given a sorting paramter. It then builds HTML for each item in the 
  // sorted list, and appends this HTML to the items-container.

  //////////////////////////////////////////////////////////////////////////////

  // GLOBALS ///////////////////////////////////////////////////////////////////
  var domain = 'https://omeka.coloredconventions.org';
  var apiEndpoint = 'api/items';
  var apiUrl = `${domain}/${apiEndpoint}`
  var perPage = 50;
  var metadata = {
    // name: ID,
    title: 50,
    city: 108,
    state: 109,
    country: 110,
    date: 111, // Note this is the Start Date field YYYY-MM-DD
  };
  var type = {
    // Name : ID,
    document: 1,
    minutes: 14,
  };

  class Item {
    // Set options to empty string so defaults can be assigned.
    constructor(options = {}) {
      // Assign default value to Item fields. This will prevent any errors
      // if certain fields don't exist for an item.
      Object.assign(this, {
        id: '',
        type: '',
        date: '',
        city: '',
        state: '',
        country: '',
      }, options);
    }
    // Get additional fields by building the field value from existing data.
    get url() {
      let id = this.id;
      return `${domain}/items/show/${id}`
    }
    get year() {
      return this.date.split('-')[0];
    }
    get month() {
      return this.date.split('-')[1];
    }
    get day() {
      return this.date.split('-')[2];
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  // CLOSURES //////////////////////////////////////////////////////////////////

  // buildFetchRequests: response[FetchResponseObject] -> pages[ArrayOfNumber]
  function buildFetchRequests(response) {
    // Get total number of results from initital response header.
    let totalResults = parseInt(response.headers.get('omeka-total-results'));
    // Given the totalResults, find the totalPages.
    let totalPages = (Math.ceil(totalResults / perPage));
    // Create the pages array.
    let pages = [];
    // Populate the pages array with the page numbers to fetch.
    for (let page = 1; page <= totalPages; page++) {
      pages.push(page);
    }
    // Return the populated pages array.
    return pages;
  }

  // parseData: data[ArrayOfObject] -> items[ArrayOfItem]
  function parseData(data) {
    // Since each page is its own array of object, flatten the data.
    let blob = data.flat();

    // Set tester funcs to check metadata fields. (Metadata elements don't
    // always have the same index from item to item, so these tester funcs will
    // find the correct index).
    let isTitle = (el) => el.element.id == metadata.title;
    let isDate = (el) => el.element.id == metadata.date;
    let isCity = (el) => el.element.id == metadata.city;
    let isState = (el) => el.element.id == metadata.state;
    let isCountry = (el) => el.element.id == metadata.country;

    // Iterate over each chunk of the data blob
    const items = blob.reduce((acc, chunk) => {
      // Build metadata index
      let titleIndex = chunk.element_texts.findIndex(isTitle);
      let dateIndex = chunk.element_texts.findIndex(isDate);
      let cityIndex = chunk.element_texts.findIndex(isCity);
      let stateIndex = chunk.element_texts.findIndex(isState);
      let countryIndex = chunk.element_texts.findIndex(isCountry);

      // Create the item object
      let item = new Item();

      // Set the Item ID
      item.id = chunk.id;

      // Set metadata fields if they exist.   
      if (titleIndex != -1) {
        item.title = chunk.element_texts[titleIndex].text;
      }
      if (chunk.item_type != null) {
        item.type = chunk.item_type.id;
      }
      if (dateIndex != -1) {
        item.date = chunk.element_texts[dateIndex].text;
      }
      if (cityIndex != -1) {
        item.city = chunk.element_texts[cityIndex].text;
      }
      if (stateIndex != -1) {
        item.state = chunk.element_texts[stateIndex].text;
      }
      if (countryIndex != -1) {
        item.country = chunk.element_texts[countryIndex].text;
      }

      if (parseQuery(query, item)) {
        acc.push(item);
      }

      return acc
    }, []);

    return items

    function parseQuery(query, item) {
      let keys = Object.keys(query);
      let condition;

      let bool = keys.reduce((acc, key) => {
        if (key == 'range') {
          const year1 = query.range.split('-')[0];
          const year2 = query.range.split('-')[1];
          const range = parseDecade(year1, year2);

          condition = range.reduce((acc, year) => {
            if (item.year.indexOf(year) != -1) {
              acc = acc || true;
            }
            return acc;
          }, false);

          return condition
        } else if (key == 'state') {
          if (Array.isArray(query.state)) {
            condition = query.state.reduce((acc, state) => {
              if (item.state == state) {
                acc = acc || true;
              }
              return acc;
            }, false);

            return condition
          } else {
            condition = (item.state == query.state);
            return condition
          }

        } else if (key == 'city') {
          condition = (item.city == query.city);
          return condition
        } else if (key == 'year') {
          condition = (item.year == query.year);
          return condition
        }
        return acc && condition

      }, true);

      return bool
    }

    function parseDecade(year1, year2) {
      let diff = (year2 - year1) / 10;
      let range = [year2.slice(0, 3)];

      for (let i = 1; i <= diff; i++) {
        let inc = i * 10;

        range.unshift((year2 - inc).toString().slice(0, 3));

      }
      return range
    }

  }

  // sortItems: items[ArrayOfItem] -> items[ArrayOfItem]
  // NOTE: sortBy can be set to 'title' 'state' 'city' or 'date'
  function sortItems(items) {
    let sortBy = sort;

    let sorted = items.sort(function(a, b) {
      // Create fieldA and fieldB and set to blank string.
      let fieldA, fieldB = '';
      // Depending on the given sortBy value, set fieldA and fieldB.
      if (sortBy == 'title') {
        fieldA = a.title.toUpperCase();
        fieldB = b.title.toUpperCase();
      } else if (sortBy == 'state') {
        fieldA = a.state;
        fieldB = b.state;
      } else if (sortBy == 'city') {
        fieldA = a.city;
        fieldB = b.city;
      } else if (sortBy == 'date') {
        fieldA = a.date;
        fieldB = b.date;
      }
      // Sort by fieldA and fieldB
      if (fieldA < fieldB) {
        return -1;
      }
      if (fieldA > fieldB) {
        return 1;
      }
      // fields must be equal
      return 0;
    });

    return sorted
  }

  // buildHtml: items[ArrayOfItem] -> undefined
  function buildHtml(items) {
    // For each item in the sorted list, build HTML using url and title, append
    // this HTML to the items-container.

    for (const item of items) {
      let innerHtml = `<p><a href="${item.url}">${item.title}</a></p>`;
      let html = `<li class="item-display">${innerHtml}</li>`;
      $('#items-container').append(html);
    }

    // Log the number of items returned.
    console.log(`Returned ${items.length} items.`)
  }

  // fetchItems: pages[ArrayOfNumber] -> Undefined
  function fetchItems(pages) {
    // Collect all the fetch responses into an array
    Promise.all(pages.map(page => fetch(`${apiUrl}?page=${page}`)
        .then(response => response.json())))
      // Parse data into items
      .then(data => parseData(data))
      // Sort the items
      .then(items => sortItems(items))
      // Build the HTML, log total items returned
      .then(items => buildHtml(items));
  }

  //////////////////////////////////////////////////////////////////////////////

  // BODY //////////////////////////////////////////////////////////////////////

  // Send the initial fetch request, feed the initial response to 
  // buildFetchRequests callback, and then send those results into the 
  // fetchItems function. 
  fetch(apiUrl)
    .then(response => buildFetchRequests(response))
    .then(pages => fetchItems(pages));

  //////////////////////////////////////////////////////////////////////////////

  // END ///////////////////////////////////////////////////////////////////////
}

//omekaClassicApiClient(query, sort);
