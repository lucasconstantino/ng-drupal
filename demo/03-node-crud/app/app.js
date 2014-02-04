
/**
 * ------------------------------------------------------------------------
 * Demo 03 - Drupal CRUD via AngularJS
 * ------------------------------------------------------------------------
 * This demo show how to authenticate with Drupal and then perform CRUD
 * operations to nodes.
 */

angular.module('node-crud', ['ngRoute', 'ngCookies', 'drupal'])

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
        controller: 'NodeListController'
      })

      // Node edit page.
      .when('/nodes/:id/edit', {
        templateUrl: 'partials/node-edit.html',
        resolve: {
          node: function (Nodes, $route) {
            return Nodes.get($route.current.params.id);
          }
        },
        controller: 'NodeEditController'
      })

      // Node edit page.
      .when('/nodes/create', {
        templateUrl: 'partials/node-create.html',
        controller: 'NodeCreateController'
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
    return DrupalServices.all('node');
  })

  /**
   * LoginController.
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

  /**
   * NodeListController.
   */
  .controller('NodeListController', function ($scope, $location, Nodes) {
    // Bind the nodes to the scope.
    $scope.nodes = Nodes.getList().$object;

    /**
     * Delete node method.
     * @param  {int} nid The id of the node to be deleted.
     */
    $scope.delete = function(node) {
      var message = "O node vai ser removido! Tem certeza de que pretende continuar?";
      if (confirm(message)) {
        node.remove().then(function() {
          // Update the list upon removal.
          $scope.nodes = _.without($scope.nodes, node);
        });
      }
    };
  })

  /**
   * NodeEditController.
   */
  .controller('NodeEditController', function ($scope, $location, node) {

    // Make node available to the scope.
    $scope.node = node;

    // Flag to avoid double request on save.
    var saving = false;

    /**
     * Saves the node changes.
     */
    $scope.save = function() {
      if (!saving) {
        // Modify the flag.
        saving = true;

        // Make PUT request with changes.
        node.put().then(

          // On success.
          function (response) {
            // Redirect to home.
            $location.path('/nodes');
          },

          // On failure.
          function (response) {
            alert(response.data && response.data[0] || 'Could not save the node!');
          }
        ).finally(function() { saving = false; });
      }
    };

    /**
     * Cancel edition.
     */
    $scope.cancel = function() {
      $location.path('/nodes');
    }
  })

  /**
   * NodeCreateController.
   */
  .controller('NodeCreateController', function ($scope, $location, Nodes) {

    // Make node available to the scope.
    $scope.node = {};

    // Flag to avoid double request on save.
    var saving = false;

    /**
     * Saves the node changes.
     */
    $scope.save = function() {
      if (!saving) {
        // Modify the flag.
        saving = true;

        // Make POST request with changes.
        Nodes.post($scope.node).then(

          // On success.
          function (response) {
            // Redirect to home.
            $location.path('/nodes');
          },

          // On failure.
          function (response) {
            console.log('Error');
            console.log(response);
            alert(response.data && response.data[0] || 'Could not save the node!');
          }
        ).finally(function() { saving = false; });
      }
    };

    /**
     * Cancel edition.
     */
    $scope.cancel = function() {
      $location.path('/nodes');
    }
  })

  .run(function ($rootScope, $location, DrupalAuth) {
    $rootScope.auth = DrupalAuth;

    // Listen for login events.
    $rootScope.$on('drupal.auth:login.success', function (e, data) {
      $location.path('/nodes');
    });

    // Listen for logout events.
    $rootScope.$on('drupal.auth:logout.success', function (e, data) {
      if (data.DrupalAuth == DrupalAuth) {
        $location.path('/');
      }
    });

    // Listen for location changes.
    $rootScope.$on('$routeChangeStart', function (e, to) {

      // If logged in and headed to any location but the home page.
      if (!DrupalAuth.user && to.$$route && to.$$route.originalPath != '/') {

        // Prevent location change.
        e.preventDefault();
        // Go to home.
        $location.path('/');
      }
    });
  });
