(function() {
    'use strict';


    angular
        .module("itsyouonlineApp")
        .controller("UserHomeController", UserHomeController);


    UserHomeController.$inject = [
        '$q', '$rootScope', '$routeParams', '$window', '$interval', '$mdToast', '$mdMedia', '$mdDialog',
        'NotificationService', 'OrganizationService', 'UserService', 'configService'];

    function UserHomeController($q, $rootScope, $routeParams, $window, $interval, $mdToast, $mdMedia, $mdDialog,
                                NotificationService, OrganizationService, UserService, configService) {
        var vm = this;

        vm.username = $rootScope.user;
        vm.notifications = {
            invitations: [],
            approvals: [],
            contractRequests: []
        };
        vm.notificationMessage = '';

        vm.owner = [];
        vm.member = [];

        vm.user = {};

        vm.loaded = {};
        vm.selectedTabIndex = 0;

        vm.checkSelected = checkSelected;
        vm.accept = accept;
        vm.reject = reject;
        vm.getPendingCount = getPendingCount;
        vm.showEmailDetailDialog = showEmailDetailDialog;
        vm.showAddEmailDialog = showAddEmailDialog;
        vm.showPhonenumberDetailDialog = showPhonenumberDetailDialog;
        vm.showAddPhonenumberDialog = showAddPhonenumberDialog;
        vm.showAddressDetailDialog = showAddressDetailDialog;
        vm.showAddAddressDialog = showAddAddressDialog;
        vm.showBankAccountDialog = showBankAccountDialog;
        vm.showFacebookDialog = showFacebookDialog;
        vm.showGithubDialog = showGithubDialog;
        vm.addFacebookAccount = addFacebookAccount;
        vm.addGithubAccount = addGithubAccount;
        vm.loadNotifications = loadNotifications;
        vm.loadOrganizations = loadOrganizations;
        vm.loadUser = loadUser;
        vm.loadAuthorizations = loadAuthorizations;
        vm.loadVerifiedPhones = loadVerifiedPhones;
        vm.showAuthorizationDetailDialog = showAuthorizationDetailDialog;
        vm.showChangePasswordDialog = showChangePasswordDialog;
        vm.showEditNameDialog = showEditNameDialog;
        vm.verifyPhone = verifyPhone;

        var genericDetailControllerParams = ['$scope', '$mdDialog', 'username', '$window', 'label', 'data',
            'createFunction', 'updateFunction', 'deleteFunction', GenericDetailDialogController];
        init();

        function init() {
            vm.selectedTabIndex = parseInt($routeParams.tab) || 0;
            loadNotifications();
        }

        function loadNotifications() {
            if (vm.loaded.notifications) {
                return;
            }
            NotificationService
                .get(vm.username)
                .then(
                    function (data) {
                        vm.notifications = data;
                        var count = getPendingCount(data.invitations);

                        if (count === 0) {
                            vm.notificationMessage = 'No unhandled notifications';
                        } else {
                            vm.notificationMessage = '';
                        }
                        vm.loaded.notifications = true;
                        $rootScope.openRequests = count;

                    }
                );
        }

        function loadOrganizations() {
            if (vm.loaded.organizations) {
                return;
            }
            OrganizationService
                .getUserOrganizations(vm.username)
                .then(
                    function (data) {
                        vm.owner = data.owner;
                        vm.member = data.member;
                        vm.loaded.organizations = true;
                    }
                );
        }

        function loadAuthorizations() {
            loadUser();
            if (vm.loaded.authorizations) {
                return;
            }
            UserService.getAuthorizations(vm.username)
                .then(
                    function (data) {
                        vm.authorizations = data;
                        vm.loaded.authorizations = true;
                    }
                );
        }

        function loadUser() {
            if (vm.loaded.user) {
                return;
            }
            UserService
                .get(vm.username)
                .then(
                    function (data) {
                        vm.user = data;
                        vm.loaded.user = true;
                        loadVerifiedPhones();
                    }
                );
        }

        function loadVerifiedPhones() {
            if (vm.loaded.verifiedPhones) {
                return;
            }
            UserService
                .getVerifiedPhones(vm.username)
                .then(function (data) {
                    vm.user.verifiedPhones = data;
                    vm.loaded.verifiedPhones = true;
                });
        }

        function getPendingCount(invitations) {
            var count = 0;
            invitations.forEach(function(invitation) {
                if (invitation.status === 'pending') {
                    count += 1;
                }
            });

            return count;
        }

        function checkSelected() {
            var selected = false;

            vm.notifications.invitations.forEach(function(invitation) {
                if (invitation.selected === true) {
                    selected = true;
                }
            });

            return selected;
        }

        function accept() {
            var requests = [];

            vm.notifications.invitations.forEach(function(invitation) {
                if (invitation.selected === true) {
                    requests.push(NotificationService.accept(invitation));
                }
            });

            $q
                .all(requests)
                .then(
                    function(responses) {
                        toast('Accepted ' + responses.length + ' invitations!');
                        vm.loaded.notifications = false;
                        loadNotifications();
                    },
                    function(reason) {
                        $window.location.href = "error" + reason.status;
                    }
                );
        }

        function reject() {
            var requests = [];

            vm.notifications.invitations.forEach(function(invitation) {
                if (invitation.selected === true) {
                    requests.push(NotificationService.reject(invitation));
                }
            });

            $q
                .all(requests)
                .then(
                    function(responses) {
                        toast('Rejected ' + responses.length + ' invitations!');
                        vm.loaded.notifications = false;
                        loadNotifications();
                    },
                    function(reason) {
                        $window.location.href = "error" + reason.status;
                    }
                );
        }

        function toast(message) {
            var toast = $mdToast
                .simple()
                .textContent(message)
                .hideDelay(2500)
                .position('top right');

            // Show toast!
            $mdToast.show(toast);
        }

        function showEmailDetailDialog(ev, label, emailaddress){
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: EmailDetailDialogController,
                templateUrl: 'components/user/views/emailaddressdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        UserService: UserService,
                        username : vm.username,
                        $window: $window,
                        label: label,
                        emailaddress : emailaddress,
                        deleteIsPossible: (Object.keys(vm.user.email).length > 1)
                    }
            })
            .then(
                function(data) {
                    if (data.newLabel) {
                        vm.user.email[data.newLabel] = data.emailaddress;
                    }
                    if (!data.newLabel || data.newLabel != data.originalLabel){
                        delete vm.user.email[data.originalLabel];
                    }
                });
        }

        function showAddEmailDialog(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: EmailDetailDialogController,
                templateUrl: 'components/user/views/emailaddressdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        UserService: UserService,
                        username : vm.username,
                        $window: $window,
                        label: "",
                        emailaddress: "",
                        deleteIsPossible: false
                    }
            })
            .then(
                function(data) {
                    vm.user.email[data.newLabel] = data.emailaddress;
                });
        }

        function showPhonenumberDetailDialog(ev, label, phonenumber){
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: genericDetailControllerParams,
                templateUrl: 'components/user/views/phonenumberdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        username : vm.username,
                        $window: $window,
                        label: label,
                        data : phonenumber,
                        createFunction: UserService.registerNewPhonenumber,
                        updateFunction: UserService.updatePhonenumber,
                        deleteFunction: UserService.deletePhonenumber
                    }
            })
            .then(
                function(data) {
                    if (data.newLabel) {
                        vm.user.phone[data.newLabel] = data.data;
                    }
                    if (!data.newLabel || data.newLabel != data.originalLabel){
                        delete vm.user.phone[data.originalLabel];
                    }
                });
        }

        function showAddPhonenumberDialog(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: genericDetailControllerParams,
                templateUrl: 'components/user/views/phonenumberdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        username : vm.username,
                        $window: $window,
                        label: "",
                        data: "",
                        createFunction: UserService.registerNewPhonenumber,
                        updateFunction: UserService.updatePhonenumber,
                        deleteFunction: UserService.deletePhonenumber
                    }
            })
            .then(
                function(data) {
                    vm.user.phone[data.newLabel] = data.data;
                });
        }

        function showAddressDetailDialog(ev, label, address){
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: genericDetailControllerParams,
                templateUrl: 'components/user/views/addressdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        username : vm.username,
                        $window: $window,
                        label: label,
                        data : address,
                        createFunction: UserService.registerNewAddress,
                        updateFunction: UserService.updateAddress,
                        deleteFunction: UserService.deleteAddress
                    }
            })
            .then(
                function(data) {
                    if (data.newLabel) {
                        vm.user.address[data.newLabel] = data.data;
                    }
                    if (!data.newLabel || data.newLabel != data.originalLabel){
                        delete vm.user.address[data.originalLabel];
                    }
                });
        }

        function showAddAddressDialog(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: genericDetailControllerParams,
                templateUrl: 'components/user/views/addressdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        username : vm.username,
                        $window: $window,
                        label: "",
                        data: {},
                        createFunction: UserService.registerNewAddress,
                        updateFunction: UserService.updateAddress,
                        deleteFunction: UserService.deleteAddress
                    }
            })
            .then(
                function(data) {
                    vm.user.address[data.newLabel] = data.data;
                });
        }

        function showBankAccountDialog(ev, label, bank) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: genericDetailControllerParams,
                templateUrl: 'components/user/views/bankAccountDialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals: {
                    username: vm.username,
                    $window: $window,
                    label: label,
                    data: bank,
                    createFunction: UserService.registerNewBankAccount,
                    updateFunction: UserService.updateBankAccount,
                    deleteFunction: UserService.deleteBankAccount
                }
            })
                .then(
                    function (data) {
                        if (data.originalLabel || !data.newLabel) {
                            delete vm.user.bank[data.originalLabel];
                        }
                        if (data.newLabel) {
                            vm.user.bank[data.newLabel] = data.data;
                        }
                    });
        }

        function showFacebookDialog(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            function doNothing() {
            }

            $mdDialog.show({
                controller: genericDetailControllerParams,
                templateUrl: 'components/user/views/facebookDialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals: {
                    username: vm.username,
                    $window: $window,
                    label: "",
                    data: vm.user.facebook,
                    createFunction: doNothing,
                    updateFunction: doNothing,
                    deleteFunction: UserService.deleteFacebookAccount
                }
            })
                .then(
                    function () {
                        vm.user.facebook = {};
                    });
        }

        function showGithubDialog(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            function doNothing() {
            }

            $mdDialog.show({
                controller: genericDetailControllerParams,
                templateUrl: 'components/user/views/githubDialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals: {
                    username: vm.username,
                    $window: $window,
                    label: "",
                    data: vm.user.github,
                    createFunction: doNothing,
                    updateFunction: doNothing,
                    deleteFunction: UserService.deleteGithubAccount
                }
            })
                .then(
                    function () {
                        vm.user.github = {};
                    });
        }

        function addFacebookAccount() {
            configService.getConfig(function (config) {
                $window.location.href = 'https://www.facebook.com/dialog/oauth?client_id='
                    + config.facebookclientid
                    + '&response_type=code&redirect_uri='
                    + $window.location.origin
                    + '/facebook_callback';
            });
        }

        function addGithubAccount() {
            configService.getConfig(function (config) {
                $window.location.href = 'https://github.com/login/oauth/authorize/?client_id=' + config.githubclientid;
            });
        }

        function showAuthorizationDetailDialog(authorization, event) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            function authController($scope, $mdDialog, user, authorization) {
                $scope.delete = UserService.deleteAuthorization;
                $scope.update = update;
                $scope.cancel = cancel;
                $scope.user = user;
                $scope.remove = remove;
                $scope.requested = {};
                var originalAuthorization = JSON.parse(JSON.stringify(authorization));
                angular.forEach(authorization, function (value, key) {
                    if (Array.isArray(value)) {
                        angular.forEach(value, function (v, i) {
                            if (!$scope.requested[key]) {
                                $scope.requested[key] = {};
                            }
                            $scope.requested[key][v] = true;
                        });
                    }
                    else if (typeof value === 'object') {
                        $scope.requested[key] = Object.keys(value);
                    } else {
                        $scope.requested[key] = value;

                    }
                });
                $scope.authorizations = authorization;

                function update(authorization) {
                    UserService.saveAuthorization($scope.authorizations)
                        .then(function (data) {
                            $mdDialog.cancel();
                            vm.authorizations.splice(vm.authorizations.indexOf(authorization), 1);
                            vm.authorizations.push(data);
                        });
                }

                function cancel() {
                    vm.authorizations.splice(vm.authorizations.indexOf(authorization), 1);
                    vm.authorizations.push(originalAuthorization);
                    $mdDialog.cancel();
                }

                function remove() {
                    UserService.deleteAuthorization(authorization)
                        .then(function (data) {
                            vm.authorizations.splice(vm.authorizations.indexOf(authorization), 1);
                            $mdDialog.cancel();
                        });
                }
            }

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'user', 'authorization', authController],
                templateUrl: 'components/user/views/authorizationDialog.html',
                targetEvent: event,
                fullscreen: useFullScreen,
                locals: {
                    user: vm.user,
                    authorization: authorization
                }
            });
        }

        function showChangePasswordDialog(event) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            function showPasswordDialogController($scope, $mdDialog, username, updatePassword) {
                var ctrl = this;
                ctrl.resetValidation = resetValidation;
                ctrl.updatePassword = updatepwd;
                ctrl.cancel = function () {
                    $mdDialog.cancel();
                };

                function resetValidation() {
                    $scope.changepasswordform.currentPassword.$setValidity('incorrect_password', true);
                    $scope.changepasswordform.currentPassword.$setValidity('invalid_password', true);
                }

                function updatepwd() {
                    updatePassword(username, ctrl.currentPassword, ctrl.newPassword).then(function () {
                        $mdDialog.hide();
                        $mdDialog.show(
                            $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Password updated')
                                .textContent('Your password has been changed.')
                                .ariaLabel('Password updated')
                                .ok('Close')
                                .targetEvent(event)
                        );
                    }, function (response) {
                        switch (response.status) {
                            case 422:
                                switch (response.data.error) {
                                    case 'incorrect_password':
                                        $scope.changepasswordform.currentPassword.$setValidity('incorrect_password', false);
                                        break;
                                    case 'invalid_password':
                                        $scope.changepasswordform.currentPassword.$setValidity('invalid_password', false);
                                        break;
                                }
                                break;
                            default:
                                $window.location.href = 'error' + response.status;
                                break;
                        }
                    });
                }
            }

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'username', 'updatePassword', showPasswordDialogController],
                controllerAs: 'ctrl',
                templateUrl: 'components/user/views/resetPasswordDialog.html',
                targetEvent: event,
                fullscreen: useFullScreen,
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                locals: {
                    username: vm.username,
                    updatePassword: UserService.updatePassword
                }
            });
        }
        function showEditNameDialog(event) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            function showPasswordDialogController($scope, $mdDialog, user, updateName) {
                var ctrl = this;
                ctrl.save = save;
                ctrl.cancel = function () {
                    $mdDialog.cancel();
                };
                ctrl.firstname = user.firstname;
                ctrl.lastname = user.lastname;

                function save() {
                    updateName(user.username, ctrl.firstname, ctrl.lastname)
                        .then(function (response) {
                            $mdDialog.hide();
                            vm.user.firstname = ctrl.firstname;
                            vm.user.lastname = ctrl.lastname;
                        });
                }
            }

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'user', 'updateName', showPasswordDialogController],
                controllerAs: 'ctrl',
                templateUrl: 'components/user/views/nameDialog.html',
                targetEvent: event,
                fullscreen: useFullScreen,
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                locals: {
                    user: vm.user,
                    updateName: UserService.updateName
                }
            });
        }

        function verifyPhone(event, label, phonenumber) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            var interval;

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$interval', 'user', 'label', 'phonenumber', verifyPhoneDialogController],
                controllerAs: 'ctrl',
                templateUrl: 'components/user/views/verifyPhoneDialog.html',
                targetEvent: event,
                fullscreen: useFullScreen,
                locals: {
                    user: vm.user,
                    label: label,
                    phonenumber: phonenumber
                }
            }).finally(function () {
                $interval.cancel(interval);
            });

            function verifyPhoneDialogController($scope, $mdDialog, $interval, user, label, phonenumber) {
                var ctrl = this;
                ctrl.label = label;
                ctrl.phonenumber = phonenumber;
                ctrl.close = close;
                ctrl.submit = submit;
                ctrl.validationKey = '';
                ctrl.resetValidation = resetValidation;

                init();

                function init() {
                    UserService
                        .sendPhoneVerificationCode(vm.username, label)
                        .then(function (responseData) {
                            ctrl.validationKey = responseData.validationkey;
                            interval = $interval(checkconfirmation, 1000);
                        }, function (response) {
                            $mdDialog.show(
                                $mdDialog.alert()
                                    .clickOutsideToClose(true)
                                    .title('Error')
                                    .textContent('Failed to send verification code. Please try again later.')
                                    .ariaLabel('Error while sending verification code')
                                    .ok('Close')
                                    .targetEvent(event)
                            );
                        });
                }

                function close() {
                    $mdDialog.cancel();
                }

                function checkconfirmation() {
                    UserService
                        .getVerifiedPhones(vm.username)
                        .then(function success(confirmedPhones) {
                            var isConfirmed = false;
                            angular.forEach(confirmedPhones, function (number, label) {
                                if (label === ctrl.label) {
                                    isConfirmed = true;
                                }
                            });
                            if (isConfirmed) {
                                vm.user.verifiedPhones[ctrl.label] = ctrl.phonenumber;
                                close();
                            }
                        });
                }

                function submit() {
                    UserService
                        .verifyPhone(user.username, ctrl.label, ctrl.validationKey, ctrl.smscode)
                        .then(function () {
                            vm.user.verifiedPhones[ctrl.label] = ctrl.phonenumber;
                            close();
                        }, function (response) {
                            if (response.status === 422) {
                                $scope.form.smscode.$setValidity('invalid_code', false);
                            }
                        });
                }

                function resetValidation() {
                    $scope.form.smscode.$setValidity('invalid_code', true);
                }
            }
        }
    }


    function EmailDetailDialogController($scope, $mdDialog, username, UserService, $window, label, emailaddress, deleteIsPossible) {
        //If there is an emailaddress, it is already saved, if not, this means that a new one is being registered.

        $scope.emailaddress = emailaddress;
        $scope.deleteIsPossible = deleteIsPossible;

        $scope.originalLabel = label;
        $scope.label = label;
        $scope.username = username;

        $scope.cancel = cancel;
        $scope.validationerrors = {}
        $scope.create = create;
        $scope.update = update;
        $scope.deleteEmailAddress = deleteEmailAddress;


        function cancel(){
            $mdDialog.cancel();
        }

        function create(label, emailaddress){
            if (Object.keys($scope.emailaddressform.$error).length > 0 ){return;}
            $scope.validationerrors = {};
            UserService.registerNewEmailAddress(username, label, emailaddress).then(
                function(data){
                    $mdDialog.hide({originalLabel: "", newLabel: label, emailaddress: emailaddress});
                },
                function(reason){
                    if (reason.status == 409){
                        $scope.validationerrors.duplicate = true;
                    }
                    else
                    {
                        $window.location.href = "error" + reason.status;
                    }
                }
            );
        }

        function update(oldLabel, newLabel, emailaddress){
            if (Object.keys($scope.emailaddressform.$error).length > 0 ){return;}
            $scope.validationerrors = {};
            UserService.updateEmailAddress(username, oldLabel, newLabel, emailaddress).then(
                function(data){
                    $mdDialog.hide({originalLabel: oldLabel, newLabel: newLabel, emailaddress: emailaddress});
                },
                function(reason){
                    if (reason.status == 409){
                        $scope.validationerrors.duplicate = true;
                    }
                    else
                    {
                        $window.location.href = "error" + reason.status;
                    }
                }
            );
        }

        function deleteEmailAddress(label){
            $scope.validationerrors = {};
            UserService.deleteEmailAddress(username, label).then(
                function(data){
                    $mdDialog.hide({originalLabel: label, newLabel: ""});
                },
                function(reason){
                    $window.location.href = "error" + reason.status;
                }
            );
        }

    }


    function GenericDetailDialogController($scope, $mdDialog, username, $window, label, data, createFunction, updateFunction, deleteFunction) {

        $scope.data = data;

        $scope.originalLabel = label;
        $scope.label = label;
        $scope.username = username;

        $scope.cancel = cancel;
        $scope.validationerrors = {};
        $scope.create = create;
        $scope.update = update;
        $scope.remove = remove;

        function cancel(){
            $mdDialog.cancel();
        }

        function create(label, data){
            if (Object.keys($scope.dataform.$error).length > 0 ){return;}
            $scope.validationerrors = {};
            createFunction(username, label, data).then(
                function(response){
                    $mdDialog.hide({originalLabel: "", newLabel: label, data: data});
                },
                function(reason){
                    if (reason.status == 409){
                        $scope.validationerrors.duplicate = true;
                    }
                    else
                    {
                        $window.location.href = "error" + reason.status;
                    }
                }
            );
        }

        function update(oldLabel, newLabel, data){
            if (Object.keys($scope.dataform.$error).length > 0 ){return;}
            $scope.validationerrors = {};
            updateFunction(username, oldLabel, newLabel, data).then(
                function(response){
                    $mdDialog.hide({originalLabel: oldLabel, newLabel: newLabel, data: data});
                },
                function(reason){
                    if (reason.status == 409){
                        $scope.validationerrors.duplicate = true;
                    }
                    else
                    {
                        $window.location.href = "error" + reason.status;
                    }
                }
            );
        }

        function remove(label){
            $scope.validationerrors = {};
            deleteFunction(username, label).then(
                function(response){
                    $mdDialog.hide({originalLabel: label, newLabel: ""});
                },
                function(reason){
                    $window.location.href = "error" + reason.status;
                }
            );
        }

    }

})();
