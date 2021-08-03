/**
 * JQuery scripts to add functionality to Omeka SOLR results page.
 * @function Solr.toggleFacetButtonContainer Adds click function to each 
 * facet-items label in the facet container. 
 * @function Solr.toggleShowFacetButtons Adds click function to each facet 
 * containers 'Show More' and 'Show Less' buttons.
 */

if (!Solr) {
  var Solr = {};
}

(function ($) {

  // Globals
  const screenDesktop = '1200px'; // Min-width for desktop
  
  /**
   * Adds click function to facet item labels.
   * @author Michelle Byrnes
   */
  Solr.toggleFacetButtonContainer = function() {

    // Helper Functions

    /**
     * Handle toggle behavior
     * @param {Element} button A given DOM element that is the facet-item
     * display toggle
     * @param {Element} arrow A given DOM element that is an arrow that shows 
     * the display state
     * @param {Element} toggleBlock A given DOM elmenet to show/hide
     */
    function handleToggle(button, arrow, toggleBlock) {

      // Helper Functions

      /**
       * Handles view events for given media query.
       * @param {MediaQueryList} mediaQuery The screen size to test for. 
       */
      function handleMediaQuery(mediaQuery) {
        if (mediaQuery.matches) { // Desktop
				
          // Show the toggleBlock by default on desktop
          toggleBlock.show();
          // Account for arrow change
          if (arrow.hasClass('down')) { 
            arrow.removeClass('down').addClass('up');
          }
          
        } else { // Mobile or Tablet
        
          // Close the toggleBlock by default on mobile and tablet
          toggleBlock.hide();
          // Account for arrow change
          if (arrow.hasClass('up')) {
            arrow.removeClass('up').addClass('down');
          }
        }
      }

      // Main Body
      
      // Media query to target desktop
      const mediaQuery = window.matchMedia(`(min-width: ${screenDesktop})`);
      
      // Register event listener
      mediaQuery.addEventListener('change', handleMediaQuery);
      
      // Do initial check
      handleMediaQuery(mediaQuery);

      // Add click event function
      button.click(function() { // On button click
        if (arrow.hasClass('down')) { // Closed, toggle 'Open'
          toggleBlock.show();
          arrow.removeClass('down').addClass('up');
        } else { // Open, toggle 'Closed'
          toggleBlock.hide();
          arrow.removeClass('up').addClass('down');
        }
      });
      
    }

    // Main Function Body

    // Count total number of facet items, assign value to total.
    let total = $('.facet-container').length;

    // Iterate total times, add click functionlity to facet item labels.
    for (i = 1; i <= total; i++) { // For each facet item

      // Define toggle variables given current facet item index, i.
      let facetItemLabel = $(`.container-${i} .facet-label-container`);
      let facetItemArrow = $(`.container-${i} .arrow`);
      let facetItemFacets = $(`.container-${i} .facet-button-container`);

      // Apply click function
      handleToggle(facetItemLabel, facetItemArrow, facetItemFacets);
    }
  };
  
  /**
   * Adds click function to 'Show More' and 'Show Less' buttons.
   * @author Michelle Byrnes 
   */
   Solr.toggleShowFacetButtons = function() {

    // Helper Functions

    /**
     * Add functionality to a given toggle button.
     * @param {Element} toggleOn A given DOM element that is the toggle 'on' 
     * @param {Element} toggleOff A given DOM element that is the toggle 'off'
     * @param {Boolean} toggleType True to toggle 'on' false to toggle 'off'
     * @param {Element[]} facets An array of facets to toggle on or off.
     */
    function toggleFacetsOnOff(toggleOn, toggleOff, toggleType, facets) {
      if (toggleType) { // True, toggle facets 'on'

        // Add click event listener to toggle 'on' button
        toggleOn.click(function() {
          // Show the remaining facets
          facets.show();
          // Toggle the show more button 'off'
          toggleOn.hide();
          // Toggle the show less button 'on'
          toggleOff.show();
        });

      } else { // False, toggle facets 'off'
          let length = facets.length;

          toggleOff.click(function() {
            // Hide all but the first 5 facets
            facets.slice(5, length).hide();
            // Toggle the show less button 'off'
            toggleOff.hide();
            // Toggle the show more button 'on'
            toggleOn.show();          
          });
      }
    }

    // Main Function Body

    // Set the iterator counter length, use total number of facet-items.
    let totalFacetItems = $('.facet-button-container > ul').length;

    // For each facet-item in a list of facet-items:
    for (i = 1; i < (totalFacetItems + 1); i++) {

      // Define toggles given current container, i.
      let toggleOn = $(`.container-${i} .toggle-facet-show-more`);
      let toggleOff = $(`.container-${i} .toggle-facet-show-less`);
      let facets = $(`.facet-item-${i} li`);

      // Apply toggle functionality
      toggleFacetsOnOff(toggleOn, toggleOff, true, facets); // 'Show More'
      toggleFacetsOnOff(toggleOn, toggleOff, false, facets); // 'Show Less'
    }
  };
  
})(jQuery);