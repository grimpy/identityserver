(function () {
    'use strict';
    angular.module('loginApp', ['ngMaterial', 'ngMessages', 'ngRoute', 'itsyouonline.header'])
        .config(['$mdThemingProvider', themingConfig])
        .config(['$routeProvider', routeConfig]);

    function themingConfig($mdThemingProvider) {
        $mdThemingProvider.definePalette('blueish', {
            '50': '#f7fbfd',
            '100': '#badeed',
            '200': '#8ec8e2',
            '300': '#55add3',
            '400': '#3ca1cd',
            '500': '#3091bb',
            '600': '#2a7ea3',
            '700': '#236b8a',
            '800': '#1d5872',
            '900': '#17455a',
            'A100': '#f7fbfd',
            'A200': '#badeed',
            'A400': '#3ca1cd',
            'A700': '#236b8a',
            'contrastDefaultColor': 'light',
            'contrastDarkColors': '50 100 200 300 400 A100 A200 A400'
        });
        $mdThemingProvider
            .theme('default')
            .primaryPalette('blueish');
    }

    function routeConfig($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'components/login/views/loginform.html',
                controller: 'loginController',
                controllerAs: 'vm'
            })
            .when('/totp', {
                templateUrl: 'components/login/views/logintotpform.html',
                controller: 'totpController',
                controllerAs: 'vm'
            })
            .when('/sms', {
                templateUrl: 'components/login/views/loginsmsform.html',
                controller: 'smsController',
                controllerAs: 'vm'
            })
            .when('/forgotpassword', {
                templateUrl: 'components/login/views/forgotpassword.html',
                controller: 'forgotPasswordController',
                controllerAs: 'vm'
            })
            .otherwise('/');
    }
})();