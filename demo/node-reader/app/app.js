
/**
 * ------------------------------------------------------------------------
 * Demo - Drupal Node-Reader via AngularJS
 * ------------------------------------------------------------------------
 * This demo application makes use of the drupal-services angular module
 * to consume node data and show as a list.
 */

angular.module('node-reader', ['drupal.services'])
  
  /**
   * DrupalServices configuration.
   */
  .config(function (DrupalServicesProvider) {

    // The base url set bellow should point to your Drupal Services
    // endpoint. To understand how it works, please refeer to
    // (https://drupal.org/node/783460).
    
    // If you are running the Drupal in a different domain from the
    // AngularJS application (as is my case), you have to allow CORS on
    // the Drupal side. You can do it thorught the CORS module of Drupal,
    // which you can find at (https://drupal.org/project/cors).
    
    var baseUrl = (config.baseUrl ? config.baseUrl + '/' : '') + config.endpoint;

    DrupalServicesProvider.setBaseUrl(baseUrl);

  })

  /**
   * Create a factory only for managing the nodes resource.
   */
  .factory('Nodes', function(DrupalServices) {

    // "node" is a endpoint at Drupal that should return a collection of nodes.
    return DrupalServices.all('node').getList().$object;
  })

  /**
   * NodeReaderController
   */
  .controller('NodeReaderController', function ($scope, Nodes) {
    $scope.nodes = Nodes;
  });
