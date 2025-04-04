
angular.module('hrmsApp', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
   // alert("hii");
    $routeProvider
        .when('/addemp', {
            templateUrl: 'templates/addemp.html', // Adjusted to load correctly
            controller: 'AddEmployeeController'
        })
        .otherwise({
            redirectTo: '/' // Redirect to the main page
        });
}])
.controller('MainController', ['$scope', '$location', function($scope, $location) {
    $scope.navigate = function(path) {
       // alert("hii");
        $location.path(path);
    };
}])
.controller('AddEmployeeController', ['$scope', function($scope) {
   // alert("hii");
    $scope.message = "Welcome to the Add Employee Page"; // Logic for this controller
}]);
