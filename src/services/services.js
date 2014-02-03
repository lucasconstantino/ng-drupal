
/**
 * ------------------------------------------------------------------------
 * Drupal Services Module Manifest
 * ------------------------------------------------------------------------
 * Module responsible for interacting with Drupal's "Services" module,
 * available at (https://drupal.org/project/services).
 * 
 * This file is responsible for instantiating the module itself.
 */

angular.module('drupal.services', [
    'restangular'
  ])

  /**
   * Main Drupal Services provider.
   */
  .provider('DrupalServices', function(RestangularProvider, $injector) {

    // Drupal services is simply a wrapper to Restangular because we don't
    // need to reinvent the wheel.
    // Read more on Restangular: (https://github.com/mgonto/restangular)
    DrupalServicesProvider = RestangularProvider;

    return DrupalServicesProvider
  })

  /**
   * DrupalServices configuration.
   */
  .config(function (DrupalServicesProvider) {

    /**
     * Extend all DrupalServices resources.
     * @return {[type]} [description]
     */
    DrupalServicesProvider.setOnElemRestangularized(function (resource) {
      
      /**
       * Function to check if resource is cross-domain.
       */
      this.isCrossDomain = function() {
        var parser = document.createElement('a');
        parser.href = this.baseUrl;

        return this.isAbsoluteUrl() && parser.hostname != location.hostname;
      };

      return resource;
    });

    // Configure the Restangular object.
    DrupalServicesProvider.setDefaultHttpFields({

      // Cache is nice. Anyway, you can always override this
      // setting on a per-resource base later on.
      cache: true,
    });
  });
