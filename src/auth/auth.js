
/**
 * ------------------------------------------------------------------------
 * Drupal Auth Module Manifest
 * ------------------------------------------------------------------------
 * Module responsible for authenticating with Drupal using the "Services"
 * module's REST API, available at (https://drupal.org/project/services).
 *
 * This module depends on the drupal.services modules as it authenticates
 * via REST.
 * 
 * This file is responsible for instantiating the module itself.
 */

angular.module('drupal.auth', [
    'drupal.services'
  ])

  /**
   * Main Drupal Auth provider.
   */
  .provider('DrupalAuth', function(DrupalServicesProvider) {

    // ------------------------------------
    // Private Settings
    // ------------------------------------

    var DrupalAuthProvider = {};  // The provider returning object.
    var defaultEndpoint = 'user'; // The endpoint for account and users actions.


    // ------------------------------------
    // Public Methods
    // ------------------------------------

    /**
     * Changes the default endpoint for users.
     */
    DrupalAuthProvider.setDefaultEndpoint = function(path) {
      defaultEndpoint = path;
    };

    /**
     * Service getter.
     */
    DrupalAuthProvider.$get = function(DrupalServices, $rootScope, $http, $injector) {

      // Hold a reference to all authentication services 
      var authenticationServices = [];

      /**
       * Verifies if a resource object is in use by any authentication service
       * previously created.
       */
      function uniqueResource(resource) {
        return authenticationServices.map(function(service) {
          return service.getResource();
        }).indexOf(resource) == -1;
      }

      /**
       * Configure endpoint custom methods.
       */
      function extendEndpoint(endpoint, resource) {
        extendEndpoint.done = extendEndpoint.done || [];

        // This logic avoids extending endpoint twice. 
        if (extendEndpoint.done.indexOf(endpoint) === -1) {
          resource.addElementTransformer(endpoint, true, function(element) {

            // Register the login method as a simple post.
            element.addRestangularMethod('login', 'post', 'login');

            // Register the logout method as a simple post.
            element.addRestangularMethod('logout', 'post', 'logout');

            // Register the token request method.
            element.addRestangularMethod('token', 'post', 'token');

            return element;
          });

          extendEndpoint.done.push(endpoint);
        }
      }

      /**
       * Drupal Authentication class.
       */
      var DrupalAuth = function(endpoint, resource, name) {

        // ------------------------------------
        // Public Properties
        // ------------------------------------

        this.user = null; // The user returned from Drupal's authentication.


        // ------------------------------------
        // Private Properties
        // ------------------------------------

        var DrupalAuth = this; // Keep a reference to this service's object.
        var REST = resource.all(endpoint); // Creates a Restangular resource.

        // @todo: allow application to define authentication service 'name' to be
        // used as reference for later cookie calls.

        var session_name = null; // Session name returned from Drupal's authentication.
        var sessid = null;       // Session ID returned from Drupal's authentication.
        var CSRFtoken = null;    // The token used for cross site requests.


        // ------------------------------------
        // Private Methods
        // ------------------------------------

        /**
         * Request the Drupal server for a CSRF token.
         */
        function setCSRFtoken() {

          // Make the request.
          var promise = REST.token()

          // Set some callbacks.
          promise.then(

            // Run upon token receival.
            function (response) {

              // Save token.
              CSRFtoken = response.token;

              // Broadcast token receival event.
              $rootScope.$broadcast('drupal.auth:token.success', {
                DrupalAuth: DrupalAuth
              });
            },

            // Run upon token request failure.
            function (response) {
              $rootScope.$broadcast('drupal.auth:token.failure', {
                DrupalAuth: DrupalAuth,
                response: response
              });
            }
          );

          // Return the promise, for further callback registering.
          return promise;
        }

        /**
         * Remember user credentials for new page requests.
         */
        function setCredentialsCookie() {

          // Load cookies service.
          $cookieStore = $injector.get('$cookieStore');

          // Parse cookies.
          var credentialsCookie = $cookieStore.get('DrupalAuth') || {};

          // @todo: we should allow user to define a name to use in the session
          // persistence, as the current method only allows for 1 user to be
          // kept authenticated in each REST resource url. Nevertheless, to
          // work arround this issue a application could implement two endpoints
          // at the Drupal side, and authenticate each user with one endpoint.

          // Set cookie data.
          credentialsCookie[resource.configuration.baseUrl] = {
            session_name: session_name,
            sessid: sessid
          };

          // Save cookie.
          $cookieStore.put('DrupalAuth', credentialsCookie);
        }

        /**
         * Remove credentials cookie.
         */
        function removeCredentialsCookie() {

          // User might not be using ngCookie, so injection might not work.
          // In this case, we simply don't use cookies, ignoring the feature.
          try {

            // Load cookies service.
            $cookieStore = $injector.get('$cookieStore');

            // Parse cookies.
            var credentialsCookie = $cookieStore.get('DrupalAuth') || {};

            // @todo: we should allow user to define a name to use in the session
            // persistence, as the current method only allows for 1 user to be
            // kept authenticated in each REST resource url. Nevertheless, to
            // work arround this issue a application could implement two endpoints
            // at the Drupal side, and authenticate each user with one endpoint.

            // Remove cookie data.
            delete credentialsCookie[resource.configuration.baseUrl];

            // Save cookie.
            $cookieStore.put('DrupalAuth', credentialsCookie);
          } catch(e) {
            // Ignore cookiesProvider error, but throw up any other.
            if (e.message && e.message.indexOf('Unknown provider: $cookiesProvider') == -1) {
              throw e;
            }
          }
        }

        /**
         * Read cookie saved credentials if any.
         */
        function authenticateFromCookie() {

          // User might not be using ngCookie, so injection might not work.
          // In this case, we simply don't use cookies, ignoring the feature.
          try {
            // Load cookies service.
            $cookieStore = $injector.get('$cookieStore');

            // Load cookie.
            var credentialsCookie = $cookieStore.get('DrupalAuth');

            // Verify if there is a saved cookie for the resource in use.
            if (credentialsCookie && credentialsCookie[resource.configuration.baseUrl]) {

              // Save session data.
              session_name = credentialsCookie[resource.configuration.baseUrl].session_name;
              sessid = credentialsCookie[resource.configuration.baseUrl].sessid;

              // Request a token.
              setCSRFtoken()

                // On token receival.
                .then(function() {

                  // Go get the user object.
                  resource.all('system/connect').customPOST().then(

                    // Run if login is successful.
                    function (response) {

                      // Save authentication information.
                      DrupalAuth.user = response.user;
                      session_name = response.session_name;
                      sessid = response.sessid;

                      // Broadcast login event.
                      // We don't broadcast the full response because the session should
                      // not be broadcasted.
                      $rootScope.$broadcast('drupal.auth:login.success', {
                        DrupalAuth: DrupalAuth,
                        cookie: true // Let listener know it was made using a cookie system.
                      });
                    },

                    // Run if user retrieval failed.
                    function (response) {

                      // Reset session data.
                      session_name = null;
                      sessid = null;

                      $rootScope.$broadcast('drupal.auth:cookie-login.failure', {
                        DrupalAuth: DrupalAuth,
                        response: response
                      });
                    }
                  );
                },

                // On token request failure.
                function (response) {

                  // Reset session data.
                  session_name = null;
                  sessid = null;
                });
            }
          } catch(e) {
            // Ignore cookiesProvider error, but throw up any other.
            if (e.message && e.message.indexOf('Unknown provider: $cookiesProvider') == -1) {
              throw e;
            }
          }
        }


        // ------------------------------------
        // Public Methods
        // ------------------------------------

        /**
         * Attempts to login.
         * @param  {String} username The user's username.
         * @param  {String} password The user's password.
         * @return {Object}          A promise to be resolved on login success and
         *                           rejected on login failure.
         */
        this.login = function(username, password, remember) {

          // Parse remember flag.
          remember = typeof remember == 'undefined' ? false : remember;

          var promise = REST.login({
            username: username,
            password: password
          });

          // Listen to request result.
          promise.then(

            // Run if login is successful.
            function (response) {

              // Save authentication information.
              DrupalAuth.user = response.user;
              session_name = response.session_name;
              sessid = response.sessid;

              // Remember credentials.
              if (remember) setCredentialsCookie();

              // If application uses cross-domain, require a CSRF token.
              if (resource.configuration.isCrossDomain()) setCSRFtoken();

              // Broadcast login event.
              // We don't broadcast the full response because the session should
              // not be broadcasted.
              $rootScope.$broadcast('drupal.auth:login.success', {
                DrupalAuth: DrupalAuth
              });
            },

            // Run if login failed.
            function (response) {
              $rootScope.$broadcast('drupal.auth:login.failure', {
                DrupalAuth: DrupalAuth,
                response: response
              });
            }
          );

          return promise;
        }

        /**
         * Logout.
         * @return {Object} A promise to be resolved upon logout success and rejected
         *                  on logout failure. It might fail if the server could not
         *                  finish the user's session, or if the connection was lost. 
         */
        this.logout = function() {
          var promise = REST.logout();

          // Listen to request result.
          promise.then(
            // Run if logout is successful.
            function (response) {

              // Reset authentication information.
              DrupalAuth.user = null;
              session_name = null;
              sessid = null;
              CSRFtoken = null;

              // Optionally reset cookie.
              removeCredentialsCookie();

              // Broadcast logout event.
              $rootScope.$broadcast('drupal.auth:logout.success', {
                DrupalAuth: DrupalAuth
              });
            },

            // Run if logout failed.
            function (response) {
              $rootScope.$broadcast('drupal.auth:logout.failure', {
                DrupalAuth: DrupalAuth,
                response: response
              });
            }
          );

          return promise;
        };

        /**
         * Configure the request to add authentication and cross-domain headers.
         * @param  {Object} request A request object as provided to the $http interceptor.
         */
        this.configureRequest = function(request) {

          // Add authentication header, if available.
          if (session_name && sessid) {
            request.headers['Authentication'] = session_name + '=' + sessid;
          }

          // Add cross-domain token, if available.
          if (CSRFtoken) {
            request.headers['X-CSRF-Token'] = CSRFtoken;
          }
        };

        /**
         * Returns the resource used with authentication.
         */
        this.getResource = function() {
          return resource;
        };


        // ------------------------------------
        // Construction Logic
        // ------------------------------------
        
        // Make object be available to request interceptors.
        resource.setDefaultHttpFields({
          DrupalAuth: DrupalAuth
        });

        // Try to authenticate form a previously set cookie.
        authenticateFromCookie();
      };

      /**
       * Authentication service instance creator.
       * @return {Object} A authentication service object for the given endpoint.
       */
      DrupalAuth.prototype.new = function(endpoint, resource, name) {

        // Parse the endpoint, using default configuration.
        endpoint = typeof ednpoint == 'undefined' || !endpoint ? defaultEndpoint : endpoint;

        // Parse the resource, using DrupalServices as default.
        resource = typeof resource == 'undefined' || !resource ? DrupalServices : resource;

        // Avoid using same resource for different authentication services.
        if (this.getResource && !uniqueResource(resource)) {
          resource = resource.withConfig(function () {});
        }

        // Extend the endpoint with custom authentication related methods.
        extendEndpoint(endpoint, resource);

        return new DrupalAuth(endpoint, resource, name);
      };

      // Return a default authentication service.
      return DrupalAuth.prototype.new(defaultEndpoint, null, 'primary');
    };

    return DrupalAuthProvider;
  })
  
  /**
   * Configure the request interceptors.
   */
  .config(function ($httpProvider, DrupalServicesProvider) {

    $httpProvider.interceptors.push(function () {
      return {
        'request': function (config) {

          // If request has a DrupalAuth object available, let it configure
          // the request to add authentication headers.
          if (config.DrupalAuth) {
            config.DrupalAuth.configureRequest(config);
          }

          return config;
        }
      };
    });

  });
