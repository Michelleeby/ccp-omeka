// Name: omeka-classic-api-client
// Input: query[Object] and sort[String]
// Author(s): Michelle Byrnes
// Description: Fetches data from Omeka, parses it, and then sorts it according
// to a query and a sort parameter. 
// Version: 4.0

////////////////////////////////////////////////////////////////////////////////

// CONTENTS ////////////////////////////////////////////////////////////////////

// Version History                  [ VERSIONS ]
// Sample Searches                  [ SAMPLES ]
// Data and Function Definitions    [ DEFINITIONS ]
// Global Declarations              [ GLOBALS ]
// Main Body                        [ BODY ]
// Functions                        [ FUNCTIONS ]

////////////////////////////////////////////////////////////////////////////////

// VERSIONS ////////////////////////////////////////////////////////////////////

// v1.0 : This version fetches, parses, and sorts data from Omeka Classic. It 
//        then injects each sorted item into a provided HTML element. (Using 
//        the TITLE and URL properties of the item). It relies on hard coded 
//        variables set in GLOBALS. Moreover, the query and sort parameter 
//        are set in their respective functions, parseData and sortItems. 

// v2.0 : This version has all the functionality of version 1, but has had 
//        the query and sort parameters abstracted out of the function body. 
//        omekaClassicApiClient now accepts two varaibles, query and sort.

// v3.0 : Added image support, removed JQuery dependency. 

// v4.0 : TODO clean up code, add clarifying comments, complete definitions.
//				Build items browse UI

////////////////////////////////////////////////////////////////////////////////

// SAMPLES /////////////////////////////////////////////////////////////////////

// query is an object where each key/value pair represents a search field to  
// search in and the value to search for respectively. Each different field is 
// searched using an AND statement if more than one field is provided. 
// See the possible query fields and sample searches below.

// Possible Query Fields:

// var query = {
//  field: 'value',                  -> EXAMPLE
//
//  range: 'YYYY-YYYY',              -> '1830-1880'
//  state: 'SA' or ['SA', 'SA', ...] -> 'PA' or ['PA', 'NY', ...]
//  city: 'City Name',               -> 'Philadelphia' or
//                                      ['Philadelphia', 'Pittsburgh', ...]
//  year: 'YYYY',                    -> '1865' or ['1854', '1855', ...]
// }

// Sample Search: 

// Get all items between '1830-1860' AND with a city field equal to 
// 'Philadelphia' OR 'Pittsburgh'
//var query = {
//  range: {start: 'YYYY', end: 'YYYY'},
//};

// sort can be 'date', 'title', 'city', or 'state', it determines the order
// the items will be sorted and displayed.
//
//var sort = 'date';

///////////////////////////////////////////////////////////////////////////////

// DEFINTIONS /////////////////////////////////////////////////////////////////

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
//
// parseData takes an ArrayOfObject, data, as its input. Iterating over each 
// item, first parseData sets all variable metadata fields to the default 
// value. It then finds the index for each metadata element. If the index
// exists for a specific field, it updates the item's field. Finally, if the
// item meets a given condition, it builds an ITEM object and pushes this
// object into the parsedItems array. The parsedItems variable is returned
// once all data has been parsed. 

// sortItems: items[ArrayOfItem] sortBy = 'String' -> items[ArrayOfItem]
//
// sortItems takes an ArrayOfItem, items, and a String, sortBy as its input.
// sortBy takes a default string, one of 'date', 'year', or 'title.' It then 
// sorts items according to the sortBy parameter and returns this sorted list
// of items. 

// buildHtml: items[ArrayOfItem] -> Undefined 
//
// This function takes an ArrayOfItem, items, as its input. It does
// not return a value, instead this function injects HTML into a given HTML
// element. For each item in the array, handleItems builds HTML for the item 
// using its url and title, it stores this in the html variable. Then, 
// buildHtml appends html to the given HTML element.

// buildFetchRequests : response[FetchResponseObject] -> pages[ArrayOfNumber]
//
// buildFetchRequests takes a FetchResponseObject, response, as its input.
// Given that this response has the header 'omeka-total-results,' and given 
// that perPage is defined, buildFetchRequests will calculate the number of
// requests needed to fetch all items and store this as totalPages. It will
// then build an array, pages, where each element is a number from 1 to 
// totalPages. Finally, it returns the pages array.

// fetchItems: pages[ArrayOfNumber] -> Undefined
//
// fetchItems takes an ArrayOfNumber, pages, as its input. It iterates over 
// pages, creating a fetch request for each page. These fetch requests are
// executed and parsed in parrellel. The combined output data of each request
// is stored in the data variable and fed to the parseData callback. Finally,
// after the data is parsed and returned as an ArrayOfItem, it is fed into
// handleItems callback. 

///////////////////////////////////////////////////////////////////////////////

function omekaClassicApiClient(query, sort) {

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
        thumbnail: '',
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

  // BODY //////////////////////////////////////////////////////////////////////

  // Send the initial fetch request, feed the initial response to 
  // buildFetchRequests callback, and then send those results into the 
  // fetchItems function. 
  fetch(apiUrl)
    .then(response => buildFetchRequests(response))
    .then(pages => fetchData(pages));

  //////////////////////////////////////////////////////////////////////////////

  // FUNCTIONS /////////////////////////////////////////////////////////////////

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

  // fetchData: pages[ArrayOfNumber] -> 
  function fetchData(pages) {
    // Collect all the fetch responses into an array
    Promise.all(pages.map(page => fetch(`${apiUrl}?page=${page}`)
        .then(response => response.json())))
      // Parse data into items, seperate items with imgs from items without.
      .then(data => parseData(data))
      // Build the items to display as HTML
      .then(items => buildItems(items))
  }

  // buildItems: items[ArrayOfArrayOfItem] -> 
  function buildItems(items) {
    let imgItems = items[0];
    let noImgItems = items[1];
    // Fetch all the item image URLs
    Promise.all(imgItems.map(item => fetch(`${domain}/api/files?item=${item.id}`)
        .then(response => response.json())))
      // Add image links to items
      .then(data => addImgsToItems(data, imgItems, noImgItems))
      // Sort the items
      .then(items => sortItems(items))
      // Build HTML to display
      .then(items => buildHtml(items));
  }

  // parseData: 
  // data[ArrayOfObject] -> 
  // items[ArrayOfItem]
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

    // Iterate over each chunk of the data blob, reduce to an array of items.
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
      // Set thumbnail to true if this needs to be fetched.
      if (chunk.files.count > 0) {
        item.thumbnail = true
      }
      // If item meets query parameters, push it into the correct acc array.
      if (parseQuery(query, item)) {
        // Seperate items into two arrays, one with images and one without.
        if (item.thumbnail) {
          acc[0].push(item);
        } else {
          acc[1].push(item);
        }
      }

      return acc
    }, [
      [],
      []
    ]);

    return items
  }
  // addImgsToItems: 
  // data[ArrayOfFile], imgItems[ArrayOfItem], noImgItems[ArrayOfItem] -> 
  // items[ArrayOfItems]
  function addImgsToItems(data, imgItems, noImgItems) {
    // Capture img file URLs into an array.
    let files = data.map(chunk => {
      let file = chunk[0].file_urls.fullsize;
      return file
    });
    // Set index to 0
    let index = 0;
    // For each item in the imgItems array
    for (const item of imgItems) {
      // Update the thumnail with the appropriate img file URL
      item.thumbnail = files[index];
      // Increment index by 1
      index++;
    }
    // Combine updated imgItems with noImgItems array.
    let items = imgItems.concat(noImgItems);

    // Return all the items.
    return items
  }

  // sortItems: items[ArrayOfItem] -> items[ArrayOfItem]
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
      let html = `
        <li class="item-display">
        	<img src="${item.thumbnail}" width=150 height=150>
          <div class="item-info">
          	<a href="${item.url}"><p>${item.title}</p></a>
            <p>${item.date}</p>
            <p>${item.state}</p>
            <p>${item.city}</p>
          </div>
        </li>
        `
        
      document.getElementById('items-container')
        .insertAdjacentHTML('beforeend', html);
    }
		// Build stable link to the records found.
    let resultsQueryUrl = buildSearchUrl(items, sort);
    let html = `<p>Found ${items.length} records. <a href="${resultsQueryUrl}">Stable link to records.</a></p>`
    // Inject link and total results into the results query wrapper element.
    document.getElementById('results-query-wrapper')
      .insertAdjacentHTML('beforeend', html)
    // Log the number of items returned.
    console.log(`Returned ${items.length} items.`)
  }

  function buildSearchUrl(items, sort) {
  	let sorter = 40; // set date as default sort value
    if (sort == 'state') {
    	sorter = metadata.state;
    }
    if (sort == 'city') {
    	sorter = metadata.city;
    }
    
    let baseUrl = `${domain}/find?range=`;
    let range = items.map(item => item.id);
    let sortParams = `&sort=${sorter}&order=a&layout=3`

    return baseUrl + range + sortParams
  }

  function testItems(items) {
    console.log(items);
  }

  // parseQuery: query[Object], item[Item] -> Boolean
  function parseQuery(query, item) {

    let keys = Object.keys(query);
    let bool = keys.reduce((acc, key) => {
      return acc && reducer(key, query, item);
    }, true);

    return bool
  }

  // reducer: key[String], query[Object], item[Item] -> Boolean
  function reducer(key, query, item) {
    if (key == 'range') {
      const year1 = query[key].split('-')[0];
      const year2 = query[key].split('-')[1];
      const range = parseDecade(year1, year2);

      return testArr(range, key, item);
    } else {
      if (Array.isArray(query[key])) {

        return testArr(query[key], key, item);
      } else {
        let condition = (item[key] == query[key]);
        return condition
      }
    }
  }

  // testArr: arr[Array], key[String], item[Object] -> Boolean
  function testArr(arr, key, item) {
    let condition = arr.reduce((acc, val) => {
      if (key == 'range') {
        if (item.year.indexOf(val) != -1) {
          acc = acc || true;
        }
        return acc
      } else {
        if (item[key] == val) {
          acc = acc || true;
        }
        return acc
      }
    }, false);

    return condition
  }

  // parseDecade: year1[String], year2[string] -> ArrayOfString
  function parseDecade(year1, year2) {
    let diff = (year2 - year1) / 10;
    let range = [year2.slice(0, 3)];

    for (let i = 1; i <= diff; i++) {
      let inc = i * 10;

      range.unshift((year2 - inc).toString().slice(0, 3));

    }
    return range
  }

  //////////////////////////////////////////////////////////////////////////////

  // END ///////////////////////////////////////////////////////////////////////
}

var form = document.querySelector("form.items-search");
form.addEventListener("submit", function(event) {
  // Flush the ul element  
  let elements = document.querySelectorAll('li.item-display');
  for (const element of elements) {
    element.remove();
  }

  let sort = form['sort-value-select'].value;
  let query = buildQuery(form);

  event.preventDefault();
  omekaClassicApiClient(query, sort);
});

function buildQuery(form) {
  let query = {};
  if (form['start-year'] != undefined) {
    let range = {
      range: `${form['start-year'].value}-${form['end-year'].value}`,
    }
    query = Object.assign(range, query);
  }

  return query
}
