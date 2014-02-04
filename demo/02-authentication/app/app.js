
/**
 * ------------------------------------------------------------------------
 * Demo 02 - Drupal Authentication via AngularJS
 * ------------------------------------------------------------------------
 * This demo show how to authenticate with Drupal and then consume
 * permission blocked resources.
 */

angular.module('authentication', ['ngRoute', 'ngCookies', 'drupal'])

  /**
   * Routing configuration.
   */
  .config(function ($routeProvider) {
    $routeProvider

      // Authentication view.
      .when('/', {
        templateUrl: 'partials/login.html',
        controller: 'LoginController'
      })

      // Nodes table view.
      .when('/nodes', {
        templateUrl: 'partials/nodes.html',
        controller: 'NodeReaderController'
      })
  })
  
  /**
   * DrupalServices configuration.
   */
  .config(function (DrupalServicesProvider, DrupalProvider) {
    var baseUrl = (config.baseUrl ? config.baseUrl + '/' : '') + config.endpoint;
    DrupalServicesProvider.setBaseUrl(baseUrl);
  })

  /**
   * Create a factory only for managing nodes resource.
   */
  .factory('Nodes', function(DrupalServices) {
    return DrupalServices.all('node').getList().$object;
  })

  /**
   * NodeReaderController
   */
  .controller('NodeReaderController', function ($scope, Nodes) {
    // Bind the nodes to the scope.
    $scope.nodes = Nodes;
  })

  /**
   * LoginController
   */
  .controller('LoginController', function ($timeout, $scope, $location, DrupalAuth) {

    /**
     * Attempts to login.
     */
    $scope.login = function(username, password, remember) {

      // Attempts to login with given credentials.
      DrupalAuth.login(username, password, remember)

        // On login failure.
        .catch(function (response) {
          alert(response.data && response.data[0] || 'Ops, couldn\'t authenticate :(');
        });
    };
  })

  .run(function ($rootScope, $location, DrupalAuth) {
    $rootScope.auth = DrupalAuth;

    // Listen for login events.
    $rootScope.$on('drupal.auth:login.success', function (e, data) {
      $location.path('/nodes');
    });

    // List for logout events.
    $rootScope.$on('drupal.auth:logout.success', function (e, data) {
      if (data.DrupalAuth == DrupalAuth) {
        $location.path('/');
      }
    });
  });
