
/**
 * ------------------------------------------------------------------------
 * Drupal Module Manifest
 * ------------------------------------------------------------------------
 * This module's purpose is to make it easier for your application to
 * depend on all sub-modules in this package. By depending on this one, you
 * are then depending on all others.
 *
 * p.s.: Note that you will need to load all other module's files before
 * this one, so that the dependencies are all available. This should be
 * not necessary any more if AngularJS finds a way to serve dependencies
 * dynamically, like via RequireJS or something similar.
 *
 * Also, this module will initiate the concatenation process for the
 * DrupalGlobal module. To understand why is this necessary, please refeer
 * to the module's file.
 */

angular.module('drupal', [
    'drupal.global',
    'drupal.services',
    'drupal.auth'
  ])
  
  /**
   * DrupalProvider cofiguration.
   */
  .config(function (DrupalProvider) {
    // Concatenate sub-providers.
    DrupalProvider.concat('drupal');
  })

  /**
   * Drupal run cofiguration.
   */
  .run(function (Drupal) {
    // Concatenate services.
    Drupal.concat('drupal');
  });
