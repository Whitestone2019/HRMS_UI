var app = angular.module('hrmsApp', []);

app.controller('LoginController', ['$scope', '$http', function($scope, $http) {
    // Initialize user object and error message
	 // alert("hii");
    $scope.user = {
        username: '',
        password: ''
    };
    $scope.errorMessage = '';

    // Login function to handle form submission
    $scope.login = function() {
        $http({
            method: 'POST',
            url: '/login',
            data: {
                username: $scope.user.username,
                password: $scope.user.password
            }
        }).then(function(response) {
            // Handle success response
            if (response.data.redirect) {
                window.location.href = response.data.redirect; // Redirect to homepage on successful login
            }
        }, function(error) {
            // Handle error response
            $scope.errorMessage = error.data.error || "Invalid Username & Password"; // Display error message
        });
    };
}]);
