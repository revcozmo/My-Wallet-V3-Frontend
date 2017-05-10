angular
  .module('walletApp')
  .controller('UnocoinCheckoutController', UnocoinCheckoutController);

function UnocoinCheckoutController ($scope, $timeout, $stateParams, $q, Wallet, MyWalletHelpers, Alerts, currency, modals, unocoin, accounts, $rootScope, showCheckout, buyMobile) {
  let exchange = $scope.vm.external.unocoin;

  $scope.openUnocoinSignup = (quote) => {
    $scope.modalOpen = true;
    return modals.openUnocoinSignup(exchange, quote).finally(() => { $scope.modalOpen = false; });
  };

  $scope.state = {
    account: accounts[0],
    trades: exchange.trades,
    buyLimit: exchange.profile && exchange.profile.currentLimits.buy || 100
  };

  $scope.setState = () => {
    $scope.state.trades = exchange.trades;
    $scope.state.buyLimit = exchange.profile && exchange.profile.currentLimits.buy;
  };

  $scope.stepDescription = () => {
    let stepDescriptions = {
      'verify': { text: 'Verify Identity', i: 'ti-id-badge' },
      'link': { text: 'Link Payment', i: 'ti-credit-card bank bank-lrg' }
    };
    let step = unocoin.determineStep(exchange, accounts);
    return stepDescriptions[step];
  };

  $scope.userId = exchange.user;
  $scope.siftScienceEnabled = false;

  $scope.signupCompleted = accounts[0] && accounts[0].status === 'active';
  $scope.showCheckout = $scope.signupCompleted || (showCheckout && !$scope.userId);

  $scope.inspectTrade = modals.openTradeSummary;

  $scope.tabs = {
    selectedTab: $stateParams.selectedTab || 'BUY_BITCOIN',
    options: ['BUY_BITCOIN', 'ORDER_HISTORY'],
    select (tab) { this.selectedTab = this.selectedTab ? tab : null; }
  };

  $scope.account = accounts[0];
  $scope.trades = exchange.trades;
  $scope.quoteHandler = unocoin.fetchQuote.bind(null, exchange);

  $scope.buySuccess = (trade) => {
    $scope.tabs.select('ORDER_HISTORY');
    modals.openTradeSummary(trade, 'initiated');
    exchange.fetchProfile().then($scope.setState);
    buyMobile.callMobileInterface(buyMobile.BUY_COMPLETED);
  };

  $scope.buyError = () => {
    Alerts.displayError('EXCHANGE_CONNECT_ERROR');
  };
}
