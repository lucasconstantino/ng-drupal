
/**
 * ------------------------------------------------------------------------
 * Drupal Global Module Manifest
 * ------------------------------------------------------------------------
 * This module means to create an interface for all services defined on
 * Drupal related AngularJS modules, simplifying dependency for Drupal
 * bound applications.
 *
 * This module defines the master provider "Drupal". Each Drupal related
 * module, to have it's providers and services concatenated into this one,
 * must follow a convention of naming it's services with a name starting
 * with "Drupal" (e.g.: DrupalAuth, DrupalServices), so that this service
 * can indentify these services and make the concatenation automatically.
 * Each found service and provider will then be agreggated to the "Drupal"
 * provider as a property named as the original name but without the
 * "Drupal" word.
 * 
 * e.g.: a factory called "DrupalAuth" would be available in the injectable
 * service "Drupal" by the property name of "Auth".
 *
 * Beyond that, this master "Drupal" service and provider will try to
 * encapsulate the global Drupal object, if available. This object will
 * then be available as a property of this service with the name "global".
 * Note that this property will stand undefined if you are no running this
 * application inside the Drupal environment (e.g.: a theme).
 */

angular.module('drupal.global', [])

  /**
   * Drupal Master Provider.
   * ----------------------------------------------------------------------
   * This provider, by default, does nothing but try to find a Drupal
   * object in the global scope to encapsulate it for AngularJS assets.
   * However, sub-modules (e.g. "DrupalServices") should concatenate all
   * it's services in this one, so that this object might grow depending on
   * how many Drupal related sub-modules are loaded in your app.
   * 
   */
  .provider('Drupal', function ($injector) {

    // Define the provider.
    var DrupalProvider = {};

    // Check if the global Drupal object - provided by Drupal if running
    // inside the Drupal environment - is available to encapsulate. 
    if (typeof Drupal != 'undefined') {
      DrupalProvider.global = Drupal;
    }

    /**
     * Get a array whit all "module" depedencies modules.
     * @return {Array} The list of depending modules.
     */
    function getAllDependencies(module, deep) {
      deep = typeof deep == 'undefined' ? true : deep;

      // Array of modules.
      var dependencies = [];

      // Iterate each submodule.
      module.requires.forEach(function (name) {
        var subModule = angular.module(name);

        // Save dependency.
        dependencies.push(angular.module(name));

        // Recursive calling.
        if (deep) {
          dependencies.concat(getAllDependencies(subModule, true));
        }
      });

      return dependencies;
    };

    /**
     * Get a array of all provider names available to a root module.
     */
    function getAllSubProviders(module, deep) {

      // Get all dependencies for the root module.
      var dependencies = getAllDependencies(module, deep);

      // Array of provider names.
      var providerNames = [];

      // Get all provider from Drupal submodules.
      dependencies.forEach(function (module) {
        providerNames = providerNames.concat(module._invokeQueue
          // Filter non-providers.
          .filter(function(invoke) {
            return invoke[0] == '$provide';
          })
          // Map each provider name.
          .map(function(invoke) {
            return invoke[2][0];
          })
        );
      });

      return providerNames;
    }

    /**
     * Concatenates each Drupal related sub-module providers into this
     * one to ease injection.
     * @param  {String} rootModule The root module to start looking for
     *                             Drupal sub-modules.
     */
    DrupalProvider.concat = function(rootModuleName) {

      // Load the root module object.
      var rootModule = angular.module(rootModuleName);

      // Concatenate all Drupal related sub providers.
      getAllSubProviders(rootModule)
        // Filter non-drupal providers and self provider, if any.
        .filter(function (name) {
          return name.indexOf('Drupal') === 0 && name !== 'Drupal';
        })

        // Do concatenation.
        .forEach(function (name) {
          DrupalProvider[name.replace(/^(Drupal)/, '')] = $injector.get(name + 'Provider');
        });
    };

    /**
     * Returns the proper Drupal service.
     */
    DrupalProvider.$get = function ($injector) {

      // Define the service.
      var Drupal = {};

      // Give access to the global Drupal object, if available.
      if (DrupalProvider.global) Drupal.global = DrupalProvider.global;


      /**
       * Concatenates each Drupal related sub-module services into this
       * one to ease injection.
       * @param  {String} rootModule The root module to start looking for
       *                             Drupal sub-modules.
       */
      Drupal.concat = function(rootModuleName) {

        // Load the root module object.
        var rootModule = angular.module(rootModuleName);

        // Concatenate all Drupal related sub providers.
        getAllSubProviders(rootModule)
          // Filter non-drupal providers, if any.
          .filter(function (name) {
            return name.indexOf('Drupal') === 0 && name !== 'Drupal';
          })

          // Do concatenation.
          .forEach(function (name) {
            Drupal[name.replace(/^(Drupal)/, '')] = $injector.get(name);
          });
      };

      return Drupal;
    };

    return DrupalProvider;
  });
