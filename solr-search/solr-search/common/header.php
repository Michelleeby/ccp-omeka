<!DOCTYPE html>
<html class="<?php echo get_theme_option('Style Sheet'); ?>" lang="<?php echo get_html_lang(); ?>">
<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=yes" />
    <?php if ($description = option('description')): ?>
    <meta name="description" content="<?php echo $description; ?>" />
    <?php endif; ?>

    <?php
    if (isset($title)) {
        $titleParts[] = strip_formatting($title);
    }
    $titleParts[] = option('site_title');
    ?>
    <title><?php echo implode(' &middot; ', $titleParts); ?></title>

    <?php echo auto_discovery_link_tags(); ?>

    <?php fire_plugin_hook('public_head',array('view'=>$this)); ?>
    <!-- Stylesheets -->
    <?php
    queue_css_file('style');
    queue_css_file('plugin-overrides');
    queue_css_file('ccp-results');
    queue_css_url('https://fonts.googleapis.com/css?family=Roboto:400,500&display=swap');
    queue_css_url('https://fonts.googleapis.com/css2?family=Oswald&display=swap');
    queue_css_url('https://fonts.googleapis.com/icon?family=Material+Icons');
    queue_css_file(array('iconfonts','style'));

    echo head_css();
    ?>
    <!-- JavaScripts -->
    <?php queue_js_file('vendor/modernizr'); ?>
    <?php queue_js_file('vendor/selectivizr', 'javascripts', array('conditional' => '(gte IE 6)&(lte IE 8)')); ?>
    <?php queue_js_file('vendor/respond'); ?>
    <?php queue_js_file('globals'); ?>
    <?php queue_js_file('globalsSolr'); ?>
    <?php echo head_js(); ?>
    
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-151883552-1"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());  gtag('config', 'UA-151883552-1');
    </script>
</head>
 <?php echo body_tag(array('id' => @$bodyid, 'class' => @$bodyclass)); ?>
    <?php fire_plugin_hook('public_body', array('view'=>$this)); ?>
        <header>
          <?php fire_plugin_hook('public_header', array('view'=>$this)); ?>
          <div id="site-title">
            <?php echo link_to_home_page(theme_logo()); ?>          
          </div>
          <div id="nav-container">
            <nav id="default-nav">
              <?php
                echo public_nav_main();
              ?>
            </nav>
            <nav id="desktop-nav">
              <?php
                echo public_nav_main();
              ?>
	      <a id="return-to-wp" href="http://coloredconventions.org/" target="_blank">→ RETURN: CCP Main Site</a>
            </nav>
            <button class="menu-toggle" type="button">
              <i class="material-icons">menu</i>
            </button>
            <div id="search-container">
              <h2>Search</h2>
                <?php echo search_form(array('show_advanced'=>TRUE)); ?>
            </div>
          </div>
        </header>

        <?php echo theme_header_image(); ?>
                       
    <div id="content">

<?php fire_plugin_hook('public_content_top', array('view'=>$this)); ?>