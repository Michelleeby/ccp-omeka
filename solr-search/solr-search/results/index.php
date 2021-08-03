<?php

/**
 * @package     omeka
 * @subpackage  solr-search
 * @copyright   2012 Rector and Board of Visitors, University of Virginia
 * @license     http://www.apache.org/licenses/LICENSE-2.0.html
 * @author      Scholar's Lab
 * @author      Michelle Byrnes
 */

?>


<?php queue_css_file('results'); ?>
<?php echo head(array('title' => __('Solr Search')));?>


<h1><?php echo __('Search the Records'); ?></h1>


<!-- Search form. -->
<div class="solr">
  <form id="solr-search-form">
    <input type="submit" value="Search" />
    <span class="float-wrap">
      <input type="text" title="<?php echo __('Search keywords') ?>" name="q" value="<?php
        echo array_key_exists('q', $_GET) ? $_GET['q'] : '';
      ?>" />
    </span>
  </form>
</div>


<!-- Applied facets. -->
<div id="solr-applied-facets">

  <ul>

    <!-- Get the applied facets. -->
    <?php foreach (SolrSearch_Helpers_Facet::parseFacets() as $f): ?>
      <li>

        <!-- Facet label. -->
        <?php $label = SolrSearch_Helpers_Facet::keyToLabel($f[0]); ?>
        <span class="applied-facet-label"><?php echo $label; ?></span> >
        <span class="applied-facet-value"><?php echo $f[1]; ?></span>

        <!-- Remove link. -->
        <?php $url = SolrSearch_Helpers_Facet::removeFacet($f[0], $f[1]); ?>
        (<a href="<?php echo $url; ?>">remove</a>)

      </li>
    <?php endforeach; ?>

  </ul>

</div>


<!-- Facets. -->
<div id="solr-facets">

  <h2 class="facets-title"><?php echo __('Refine Search'); ?></h2>
  
  <div class="facets-container">
    <?php
      // Set facetCounter for use in iteration, begin at 1.  
      $facetCounter = 1;
      
      foreach ($results->facet_counts->facet_fields as $name => $facets): ?>

      <!-- Does the facet have any hits? -->
      <?php if (count(get_object_vars($facets))): ?>
        <!-- Convert facet counter int to string for use in class label -->
        <?php $counterStr = strval($facetCounter); ?>

        <!-- Facet Container. -->
        <div class="<?php echo "facet-container container-{$counterStr}"; ?>">

          <!-- Facet Label Container. -->
          <div class="facet-label-container">
            <!-- Facet Label. -->
            <?php $label = SolrSearch_Helpers_Facet::keyToLabel($name); ?>
            <span class="facet-label"><?php echo $label; ?></span>
            <!-- Container State Label. -->
            <i class="arrow down"></i>
          </div>

          <!-- Facets List and Show Buttons Container. -->
          <div class="facet-button-container closed">
            
            <!-- Facets List. -->
            <ul class=<?php echo "facet-item-{$counterStr}"; ?>>

              <!-- Facets. -->
              <?php foreach ($facets as $value => $count): ?>
                <li class="<?php echo $value; ?>">

                  <!-- Facet URL. -->
                  <?php $url = SolrSearch_Helpers_Facet::addFacet($name, $value); ?>

                  <!-- Facet link. -->
                  <a href="<?php echo $url; ?>" class="facet-value">
                    <?php echo $value; ?>
                  </a>

                  <!-- Facet count. -->
                  (<span class="facet-count"><?php echo $count; ?></span>)

                </li>
              <?php endforeach; ?>
            </ul>
            
            <!-- Show Buttons. -->
            
            <!-- If facet list has more than 5 elements. -->
            <?php if (count(get_object_vars($facets)) > 5) : ?>
              <button class="toggle-facet-show-more">Show More</button>
              <button class="toggle-facet-show-less" style="display:none">Show Less</button>
            <?php endif; ?>

          </div>
          
        </div>

      <?php endif; ?>

      <!-- Increment facet counter -->
      <?php $facetCounter++; ?>

    <?php endforeach; ?>
  </div>
</div>


<!-- Results. -->
<div id="solr-results">

  <!-- Number found. -->
  <h2 id="num-found">
    <?php echo $results->response->numFound; ?> records found
  </h2>

  <?php foreach ($results->response->docs as $doc): ?>

    <!-- Document. -->
    <div class="result">
      
      <!-- Header. -->
      <div class="result-header">

        <!-- Record URL. -->
        <?php $url = SolrSearch_Helpers_View::getDocumentUrl($doc); ?>

        <!-- Title. -->
        <a href="<?php echo $url; ?>" class="result-title" target="_blank"><?php
                $title = is_array($doc->title) ? $doc->title[0] : $doc->title;
                if (empty($title)) {
                    $title = '<i>' . __('Untitled') . '</i>';
                }
                echo $title;
            ?></a>

      </div> 

      <!-- Description. -->
      <div class="result-description">

        <!-- Item Thumbnail. -->
        <a href="<?php echo $url; ?>" target="_blank">
          <?php
            $item = get_db()->getTable($doc->model)->find($doc->modelid);
            echo item_image(
                'thumbnail', 
                array('class' => 'result-thumbnail',
                      'alt' => $itemTitle, 
                      'width' => '140px', 
                      'height' => '200px'),
                0, 
                $item
            );
          ?>
        </a>

        <!-- Metadata. -->
        <ul class="result-metadata">
          <?php 
          
          $date = metadata($item, 
                            array('Item Type Metadata', 'Start Date'),
                            array('ignore_unkown' => true)
                          );
          $city = metadata($item, 
                           array('Item Type Metadata', 'City'),
                           array('ignore_unkown' => true)
                          );
          $state = metadata($item, 
                            array('Item Type Metadata', 'State'),
                            array('ignore_unkown' => true)
                           );
          $type = metadata($item,
                           array('Item Type Metadata', 'Convention Type'),
                           array('ignore_unknown' => true)
                          );
          ?>

          <?php if ($date): ?>
            <li class="result-metadata-item">
              <span class="meta-title">Date:</span> <?php echo $date; ?>
            </li>
          <?php endif; ?>

          <?php if ($city): ?>
            <li class="result-metadata-item">
              <span class="meta-title">City:</span> <?php echo $city; ?>
            </li>
          <?php endif; ?>

          <?php if ($state): ?>
            <li class="result-metadata-item">
              <span class="meta-title">State:</span> <?php echo $state; ?>
            </li>
          <?php endif; ?>

          <?php if ($type): ?>
            <li class="result-metadata-item">
              <span class="meta-title">Type:</span> <?php echo $type; ?>
            </li>
          <?php endif; ?>

        </ul>

        <!-- Highlighting. -->
        <?php if (get_option('solr_search_hl')): ?>
          <ul class="hl">
            <?php foreach($results->highlighting->{$doc->id} as $field): ?>
              <?php foreach($field as $hl): ?>
                <li class="snippet"><?php 
                  $hl = preg_replace('/&lt;.*?(&gt;|$)/', ' ', $hl);
                  $hl = preg_replace('/(^|&lt;).*?&gt;/', ' ', $hl);
                  echo html_entity_decode($hl);
                  ?></li>
              <?php endforeach; ?>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>

      </div>
      
    </div>

  <?php endforeach; ?>

</div>

<?php echo pagination_links(); ?>
<?php echo foot();
