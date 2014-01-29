
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

  .provider('DrupalServices', function(RestangularProvider, $injector) {

    // Drupal services is simply a wrapper to Restangular because we don't
    // need to reinvent the wheel.
    // Read more on Restangular: (https://github.com/mgonto/restangular)
    DrupalServicesProvider = RestangularProvider;

    // try {
    //   // Make it available to the master wrapper.
    //   $injector.get('DrupalProvider').ServicesProvider = DrupalServicesProvider;
    // } catch(e) {};

    return DrupalServicesProvider
  })

  .config(function (DrupalServicesProvider) {

    // Configure the Restangular object.
    DrupalServicesProvider.setDefaultHttpFields({

      // Cache is nice. Anyway, you can always override this
      // setting on a per-resource base later on.
      cache: true,
    });
  });
