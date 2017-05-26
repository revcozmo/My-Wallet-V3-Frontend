
angular
  .module('walletApp')
  .factory('currency', currency);

currency.$inject = ['$q', 'MyBlockchainApi'];

function currency ($q, MyBlockchainApi) {
  const SATOSHI = 100000000;
  const conversions = {};
  const fiatConversionCache = {};

  const coinifyCurrencyCodes = {
    'DKK': 'Danish Krone',
    'EUR': 'Euro',
    'GBP': 'Great British Pound',
    'USD': 'U.S. Dollar'
  };

  const coinifySellCurrencyCodes = {
    'DKK': 'Danish Krone',
    'EUR': 'Euro',
    'GBP': 'Great British Pound'
  };

  const currencyCodes = {
    'USD': 'U.S. Dollar',
    'EUR': 'Euro',
    'ISK': 'lcelandic Króna',
    'HKD': 'Hong Kong Dollar',
    'TWD': 'New Taiwan Dollar',
    'CHF': 'Swiss Franc',
    'DKK': 'Danish Krone',
    'CLP': 'Chilean, Peso',
    'CAD': 'Canadian Dollar',
    'CNY': 'Chinese Yuan',
    'THB': 'Thai Baht',
    'AUD': 'Australian Dollar',
    'SGD': 'Singapore Dollar',
    'KRW': 'South Korean Won',
    'JPY': 'Japanese Yen',
    'PLN': 'Polish Zloty',
    'GBP': 'Great British Pound',
    'SEK': 'Swedish Krona',
    'NZD': 'New Zealand Dollar',
    'BRL': 'Brazil Real',
    'RUB': 'Russian Ruble',
    'INR': 'Indian Rupee'
  };

  const bitCurrencies = [
    {
      serverCode: 'BTC',
      code: 'BTC',
      conversion: 100000000,
      btcValue: '1 BTC'
    }, {
      serverCode: 'MBC',
      code: 'mBTC',
      conversion: 100000,
      btcValue: '0.001 BTC'
    }, {
      serverCode: 'UBC',
      code: 'bits',
      conversion: 100,
      btcValue: '0.000001 BTC'
    }
  ];

  var service = {
    currencies: formatCurrencies(currencyCodes),
    coinifyCurrencies: formatCurrencies(coinifyCurrencyCodes),
    coinifySellCurrencies: formatCurrencies(coinifySellCurrencyCodes),
    bitCurrencies,
    conversions,

    fetchExchangeRate,
    updateCoinifyCurrencies,
    getFiatAtTime,
    isBitCurrency,
    decimalPlacesForCurrency,
    convertToSatoshi,
    convertFromSatoshi,
    formatCurrencyForView,
    commaSeparate
  };

  return service;

  function formatCurrencies (currencies) {
    let currencyFormat = code => ({
      code: code,
      name: currencies[code]
    });
    return Object.keys(currencies).map(currencyFormat);
  }

  function fetchExchangeRate () {
    let currencyFormat = info => ({
      symbol: info.symbol,
      conversion: parseInt(SATOSHI / info.last, 10)
    });
    let success = result => {
      Object.keys(result).forEach(code => {
        conversions[code] = currencyFormat(result[code]);
      });
    };
    let fail = error => {
      console.log('Failed to load ticker: %s', error);
    };
    return MyBlockchainApi.getTicker().then(success).catch(fail);
  }

  function getFiatAtTime (time, amount, currencyCode) {
    time = time * 1000;
    currencyCode = currencyCode.toLowerCase();

    let key = time + amount + currencyCode;
    let cached = fiatConversionCache[key];
    let cacheResult = fiat => fiatConversionCache[key] = parseFloat(fiat).toFixed(2);

    let fiatValuePromise = cached !== undefined
      ? $q.resolve(cached) : MyBlockchainApi.getFiatAtTime(time, amount, currencyCode);

    return fiatValuePromise.then(cacheResult);
  }

  function updateCoinifyCurrencies (currencies) {
    let format = (code) => ({ code, name: currencyCodes[code] });
    service.coinifyCurrencies = currencies.slice().sort().map(format);
  }

  function isBitCurrency (currency) {
    if (currency == null) return null;
    return bitCurrencies.map(c => c.code).indexOf(currency.code) > -1;
  }

  function decimalPlacesForCurrency (currency) {
    if (currency == null) return null;
    let decimalPlaces = ({ 'BTC': 8, 'mBTC': 5, 'bits': 2 })[currency.code];
    return decimalPlaces || 2;
  }

  function convertToSatoshi (amount, currency) {
    if (amount == null || currency == null) return null;
    if (isBitCurrency(currency)) {
      return Math.round(amount * currency.conversion);
    } else if (conversions[currency.code] != null) {
      return Math.ceil(amount * conversions[currency.code].conversion);
    } else {
      return null;
    }
  }

  function convertFromSatoshi (amount, currency) {
    if (amount == null || currency == null) return null;
    if (isBitCurrency(currency)) {
      return amount / currency.conversion;
    } else if (conversions[currency.code] != null) {
      return amount / conversions[currency.code].conversion;
    } else {
      return null;
    }
  }

  function formatCurrencyForView (amount, currency, showCode = true) {
    if (amount == null || currency == null) return null;
    let decimalPlaces = decimalPlacesForCurrency(currency);
    let code = showCode ? (' ' + currency.code) : '';
    if (isBitCurrency(currency)) {
      amount = amount.toFixed(decimalPlaces);
      amount = amount.replace(/\.?0+$/, '');
    } else {
      amount = parseFloat(amount).toFixed(decimalPlaces);
    }
    return commaSeparate(amount) + code;
  }

  function commaSeparate (amount) {
    let parts = amount.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+\b)/g, ',');
    return parts.join('.');
  }
}
