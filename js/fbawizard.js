/*
UK SellerID -> FBAFees Response validate marketplaceid: co.uk, de, fr, es, it
US SellerID -> FBAFees Response validate marketplaceid : com, ca, com.mx
*/

var asin = '';
var country = 'co.uk';
var weight = 0; // pound
var totalFBAFee = 0;
var flagEFN = false;
var currencyRate = 0;

var currencyType = {
  'de': 'EUR',
  'fr': 'EUR',
  'es': 'EUR',
  'it': 'EUR',
  'co.uk':  '£',
  'com':  '$',
  'ca': 'CDN$',
  'com.mx': '$'
};

var moneyType = {
  'de': 'EUR',
  'fr': 'EUR',
  'es': 'EUR',
  'it': 'EUR',
  'co.uk': 'GBP',
  'com':  'USD',
  'ca': 'CAD',
  'com.mx': 'MXN'
};

// fee result provided by mws api.
var feeType = [
  'ReferralFee',
  'VariableClosingFee',
  'PerItemFee',
  'FBAFees',
  'FBAPickAndPack',
  'FBAWeightHandling',
  'FBAOrderHandling',
  'FBADeliveryServicesFee'
];

/* =========================== credential info =========================== */
var selleridType = {
  'co.uk':  "A38N1TNOUMYB97", // UK
  'com':  "A38XX4EY2FLVSN"  // US
};

var awsaccesskeyidType = {
  'co.uk':  "AKIAJKSB4RS3Z3HS4VFA", // UK
  'com':  "AKIAISNK6WZM6U4JU2BA"  // US
};

var mwsauthtokenType = {
  'co.uk':  "7047-1479-6452", // UK
  'com':  "8770-0567-0467"  // US
};

var secretkeyType = {
  'co.uk':  "ONMx0iwWktlHmRmnVf1uPRhbWDPc5vakd3gpTYcj", // UK
  'com':  "/lND6I46/wRgUuyYGSKOGYV/ZOljAcxTcs7NLiSx"  // US
};
/* =========================== credential info =========================== */

var marketplaceidType = {
  'de': 'A1PA6795UKMFR9',
  'fr': 'A13V1IB3VIYZZH',
  'es': 'A1RKKUPIHCS9HS',
  'it': 'APJ6JRA9NG5V4',
  'co.uk':  'A1F83G8C2ARO7P',
  'com':  'ATVPDKIKX0DER',
  'ca': 'A2EUQ1WTGCTBG2',
  'com.mx': 'A1AM78C64UM0Y8'
};

var hostType = {
  'co.uk':  'mws.amazonservices.co.uk',
  'com':  'mws.amazonservices.com'
};

var signatureMethod = "HmacSHA256";
var signatureVersion = "2";
var signature = "";

var timeStamp = "";
var version = "2011-10-01";

var method = "POST";
var protocol = "https://";
var uri = "/Products/2011-10-01";
//=========================================================================

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

function isNumber(value) {
    if ((undefined === value) || (null === value)) {
        return false;
    }
    if (typeof value == 'number') {
        return true;
    }
    return !isNaN(value - 0);
}

var getPureNumber = function(value) {
    if (value && !isNumber(value)) {
        return parseFloat(value.replace(/[^\d.-]/g, ''));
    }
    return value;
}

function ISODateString(d){
  function pad(n){return n<10 ? '0'+n : n}
  return d.getUTCFullYear()+'-'
    + pad(d.getUTCMonth()+1)+'-'
    + pad(d.getUTCDate())+'T'
    + pad(d.getUTCHours())+':'
    + pad(d.getUTCMinutes())+':'
    + pad(d.getUTCSeconds())+'Z'
}

var getMoneySymbol = function() {
    return currencyType[country];
}

var getCurrencyCode = function() {
  return moneyType[country];
}

var getCurrentMarketPlaceID = function() {
  return marketplaceidType[country];
}

//============================================================================
jQuery(document).ready(function($){
    chrome.runtime.sendMessage({setHeight: $('body').outerHeight()}, function() {});

    var par = window.location.href;
    par = par.split('?');
    par = par[1];
    par = par.split('||');
    asin = par[0];
    var rank = atob(par[1]);
    var price = atob(par[2]).replace('$','').replace('£','');

    country = atob(par[3]);
    rank = rank.split(' in ');
    var category = rank[1];
    rank = rank[0];

    // if -> for 4 EU countries , else -> for EFN Fee
    if (localStorage['currencyRate']) {
      currencyRate = localStorage['currencyRate'];
    }
    else {
      getCurrencyRate("EUR", "GBP");
    }

    getSalesRankAndWeight(asin);

    if (category) {
        $('.page-result').append('<div class="label"><b>Category</b>: '+category+'</div>');
    }

    if (!category && !rank) {
        $('.page-result').hide();
    }

    if (price) {
        $('#sell-price').val(price);
    }
    $('#buy-price, #sell-price').mask('000,000,000,000,000.00', {reverse: true});

    $('#calculate-profit-btn').click(function(){
        var buyPrice = getPureNumber($.trim($('#buy-price').val()));
        var sellPrice = getPureNumber($.trim($('#sell-price').val()));

        if (buyPrice && sellPrice) {
            $('.result').html('');
            $('.calc').hide();
            $('.loader-calc').show();

            chrome.runtime.sendMessage({setHeight: $('body').outerHeight()}, function() {});

            getFBAFees(asin, sellPrice, buyPrice);

        } else {
            alert('Please inform your buy and sell price.');
        }
    });

    $('.wizard .close').click(function(){
        chrome.runtime.sendMessage({toggle: '1'}, function() {});
    });

    $('.wizard .settings').click(function(){
        chrome.runtime.sendMessage({createOptions: '1'}, function() {});
    });

    $('.marketpalce-list .flag').click(function(){
      var marketplace = $(this).attr("alt");
      chrome.runtime.sendMessage({createMarketPlace: marketplace, asin: asin}, function() {});
    });

    getSalesRankAndBuyBoxPriceEU(asin, "A1PA6795UKMFR9", "de");
    getSalesRankAndBuyBoxPriceEU(asin, "A13V1IB3VIYZZH", "fr");
    getSalesRankAndBuyBoxPriceEU(asin, "A1RKKUPIHCS9HS", "es");
    getSalesRankAndBuyBoxPriceEU(asin, "APJ6JRA9NG5V4", "it");
});

function getSalesRankAndBuyBoxPriceEU(asin, _marketplaceid, region) {

  var _action = "GetCompetitivePricingForASIN";
  var _today = new Date();
  timeStamp = ISODateString(_today);
  var _host = hostType['co.uk'];

  // important: parameter order
  var parameters = {
    //"ASINList.ASIN.1":Asin,
    "AWSAccessKeyId": awsaccesskeyidType['co.uk'],
    "Action": _action,
    "MWSAuthToken": mwsauthtokenType['co.uk'],
    "MarketplaceId":  _marketplaceid,
    "SellerId": selleridType['co.uk'],
    "SignatureMethod":  signatureMethod,
    "SignatureVersion": signatureVersion,
    //"Signature": signature,
    "Timestamp":  timeStamp,
    "Version":  version
  };

  parameters = $.param( parameters );
  var StringToSign =  method+"\n"+_host+"\n"+uri+"\n"+"ASINList.ASIN.1="+asin+"&"+parameters;
  //StringToSign = "POST\nmws.amazonservices.com\n/Products/2011-10-01\nASINList.ASIN.1=B00000JICB&AWSAccessKeyId=AKIAISNK6WZM6U4JU2BA&Action=GetCompetitivePricingForASIN&MWSAuthToken=8770-0567-0467&MarketplaceId=ATVPDKIKX0DER&SellerId=A38XX4EY2FLVSN&SignatureMethod=HmacSHA256&SignatureVersion=2&Timestamp=2017-03-09T01%3A37%3A10Z&Version=2011-10-01";

  signature = CryptoJS.HmacSHA256(StringToSign, secretkeyType['co.uk']);
  signature = signature.toString(CryptoJS.enc.Base64);
  //Signature = encodeURIComponent(Signature);

  $.ajax({
    type: "POST",
    url: protocol + _host + uri,
    data: {
      "AWSAccessKeyId": awsaccesskeyidType['co.uk'],
      "Action": _action,
      "SellerId": selleridType['co.uk'],
      "MWSAuthToken": mwsauthtokenType['co.uk'],
      "SignatureVersion": signatureVersion,
      "Timestamp":  timeStamp,
      "Version":  version,
      "Signature": signature,
      "SignatureMethod":  signatureMethod,
      "MarketplaceId":  _marketplaceid,
      "ASINList.ASIN.1":  asin
    },
    dataType: "text",
    success: function( data ) {
      console.log( "success: " + data );

      if (window.DOMParser)
      {
        parser=new DOMParser();
        xmlDoc=parser.parseFromString(data,"text/xml");
      }

      var sales_rank = "-";
      if (xmlDoc.getElementsByTagName("Rank").length != 0) {
        sales_rank = xmlDoc.getElementsByTagName("Rank")[0].childNodes[0].nodeValue;
      }

      var _currencyCode = "";
      if (xmlDoc.getElementsByTagName("CurrencyCode").length != 0) {
        _currencyCode = xmlDoc.getElementsByTagName("CurrencyCode")[0].childNodes[0].nodeValue;
      }

      var buy_box_price = "-";
      if (xmlDoc.getElementsByTagName("Amount").length != 0) {
        buy_box_price = xmlDoc.getElementsByTagName("Amount")[1].childNodes[0].nodeValue;
      }

      $('#rank_'+region).text(sales_rank);
      if (localStorage['convertEUR2GBP'] == "true") {
        if (buy_box_price == '-')
          $('#price_'+region).text('-');
        else
          $('#price_'+region).text('£' + (buy_box_price * currencyRate).format(2));
      }
      else {
        $('#price_'+region).text(_currencyCode + buy_box_price);
      }
    },
    error: function( error ) {
      console.log( "error: " + JSON.stringify(error));
    }
  });
}

function getFBAFees(asin, sellPrice, buyPrice) {

  var _action = "GetMyFeesEstimate";
  var _today = new Date();
  timeStamp = ISODateString(_today);
  var _host = "";
  var _awsAccessKeyID = "";
  var _sellerID = "";
  var _mwsAuthToken = "";
  var _secretKey = "";

  switch(country) {
    case 'de':
    case 'fr':
    case 'es':
    case 'it':
    case 'co.uk':
      _host = hostType['co.uk'];
      _awsAccessKeyID = awsaccesskeyidType['co.uk'];
      _sellerID = selleridType['co.uk'];
      _mwsAuthToken = mwsauthtokenType['co.uk'];
      _secretKey = secretkeyType['co.uk'];
      break;
    case 'com':
    case 'ca':
    case 'com.mx':
      _host = hostType['com'];
      _awsAccessKeyID = awsaccesskeyidType['com'];
      _sellerID = selleridType['com'];
      _mwsAuthToken = mwsauthtokenType['com'];
      _secretKey = secretkeyType['com'];
      break;
    default:
      _host = hostType['co.uk'];
      _awsAccessKeyID = awsaccesskeyidType['co.uk'];
      _sellerID = selleridType['co.uk'];
      _mwsAuthToken = mwsauthtokenType['co.uk'];
      _secretKey = secretkeyType['co.uk'];
  }

  // important: parameter order
  var parameters = {
    //"ASINList.ASIN.1":Asin,
    "AWSAccessKeyId": _awsAccessKeyID,
    "Action": _action,
    "FeesEstimateRequestList.FeesEstimateRequest.1.IdType": "ASIN",
    "FeesEstimateRequestList.FeesEstimateRequest.1.IdValue": asin,
    "FeesEstimateRequestList.FeesEstimateRequest.1.Identifier": "request1",
    "FeesEstimateRequestList.FeesEstimateRequest.1.IsAmazonFulfilled": "true",
    "FeesEstimateRequestList.FeesEstimateRequest.1.MarketplaceId": getCurrentMarketPlaceID(),
    "FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.ListingPrice.Amount": sellPrice,
    "FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.ListingPrice.CurrencyCode": getCurrencyCode(),
    "MWSAuthToken": _mwsAuthToken,
    "SellerId": _sellerID,
    "SignatureMethod":  signatureMethod,
    "SignatureVersion": signatureVersion,
    //"Signature": signature,
    "Timestamp":  timeStamp,
    "Version":  version
  };

  parameters = $.param( parameters );
  var StringToSign =  method+"\n"+_host+"\n"+uri+"\n"+parameters;

  signature = CryptoJS.HmacSHA256(StringToSign, _secretKey);
  signature = signature.toString(CryptoJS.enc.Base64);
  //Signature = encodeURIComponent(Signature);

  $.ajax({
    type: "POST",
    url: protocol + _host + uri,
    data: {
      "AWSAccessKeyId": _awsAccessKeyID,
      "Action": _action,
      "SellerId": _sellerID,
      "MWSAuthToken": _mwsAuthToken,
      "SignatureVersion": signatureVersion,
      "Timestamp":  timeStamp,
      "Version":  version,
      "Signature": signature,
      "SignatureMethod":  signatureMethod,
      "FeesEstimateRequestList.FeesEstimateRequest.1.MarketplaceId": getCurrentMarketPlaceID(),
      "FeesEstimateRequestList.FeesEstimateRequest.1.IdType": "ASIN",
      "FeesEstimateRequestList.FeesEstimateRequest.1.IdValue": asin,
      "FeesEstimateRequestList.FeesEstimateRequest.1.IsAmazonFulfilled": "true",
      "FeesEstimateRequestList.FeesEstimateRequest.1.Identifier": "request1",
      "FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.ListingPrice.Amount": sellPrice,
      "FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.ListingPrice.CurrencyCode": getCurrencyCode()
    },
    dataType: "text",
    success: function( data ) {
      console.log( "success: " + data );

      if (window.DOMParser)
      {
        parser=new DOMParser();
        xmlDoc=parser.parseFromString(data,"text/xml");
      }

      if ((localStorage['convertEUR2GBP'] == "true") && (country == 'de' || country == 'fr' || country == 'es' || country == 'it' )) {
        var _textFees = "";
        var _refFee;
        var _totalFee;

        var _feeList = xmlDoc.getElementsByTagName("FeeType");
        if (_feeList.length != 0) {
          if (flagEFN == true) {
            for (var i = 0; i < _feeList.length - 2; i++) {
              if (i == 1 || i == 2)
                continue;
              _textFees += _feeList[i].firstChild.nodeValue + ": " + '£' + (currencyRate * parseFloat(xmlDoc.getElementsByTagName("FinalFee")[i].childNodes[3].firstChild.nodeValue)).format(2) + "<br />";
              _refFee = parseFloat(getPureNumber(_textFees));
            }
          }
          else {
            for (var i = 0; i < _feeList.length - 1; i++) {
              if (i == 1 || i == 2)
                continue;
              _textFees += _feeList[i].firstChild.nodeValue + ": " + '£' + (currencyRate * parseFloat(xmlDoc.getElementsByTagName("FinalFee")[i].childNodes[3].firstChild.nodeValue)).format(2) + "<br />";
            }
          }
        }

        if (flagEFN == false) {
          var _textTotalFee = "";
          if (xmlDoc.getElementsByTagName("TotalFeesEstimate").length != 0) {
            _textTotalFee = currencyRate * parseFloat(xmlDoc.getElementsByTagName("TotalFeesEstimate")[0].childNodes[3].firstChild.nodeValue);
            _textFees += "TotalFBAFeesEstimate: " + '£' + _textTotalFee.format(2) + "<br />";
          }
          _totalFee = parseFloat(_textTotalFee);
        }
        else {
          _totalFee = _refFee;
        }



        if (localStorage['fixedPrepFee'] != '' && isNumber(localStorage['fixedPrepFee'])) {
            var fixedPrepFee = currencyRate * parseFloat(localStorage['fixedPrepFee']);
            _textFees += '<b>Fixed Prep. Fee: </b>' + '£' + fixedPrepFee.format(2) + '<br />';
            _totalFee += fixedPrepFee;
        }

        if (flagEFN == false) {
          if (localStorage['feeAdjustment'] != '' && isNumber(localStorage['feeAdjustment'])) {
              var feeAdjustment = (getPureNumber(_totalFee)*parseFloat(localStorage['feeAdjustment']))/100;
              _textFees += '<b>FBA Fee adjustment: </b>' + '£' + feeAdjustment.format(2) + '<br />';
              _totalFee += feeAdjustment;
          }
        }

        totalFBAFee = _totalFee;  // not included EFN Fees

        if (flagEFN == true) {
          var _efnFee = currencyRate * getEFNFee();
          totalFBAFee += _efnFee;
          _textFees += '<b>EFN Fee: </b>' + '£' + _efnFee.format(2) + '<br />';

          if (localStorage['feeAdjustment'] != '' && isNumber(localStorage['feeAdjustment'])) {
              var feeAdjustment = (getPureNumber(_efnFee)*parseFloat(localStorage['feeAdjustment']))/100;
              _textFees += '<b>EFN Fee adjustment: </b>' + '£' + feeAdjustment.format(2) + '<br />';
              totalFBAFee += feeAdjustment;
          }
        }

        _textFees += '<b>Total Fees: </b>' +  '£' + getPureNumber(totalFBAFee).format(2);

        var _profit = (currencyRate * sellPrice - currencyRate * buyPrice) - totalFBAFee;
        _textFees += '<br /><br /><h2>Your profit is ' +  '£' + _profit.format(2) + '</h2>';

        if (localStorage['profitAdjustment'] != '' && isNumber(localStorage['profitAdjustment'])) {
            var profitAdjustment = (_profit*parseFloat(localStorage['profitAdjustment']))/100;
            _profit += profitAdjustment;
            _textFees += '<h2>Profit Adjusted to ' +  '£' + _profit.format(2) + '</h2>';
        }

        _textFees += '<h2>Your ROI is '+((_profit/(buyPrice * currencyRate))*100).format(2)+'%</h2>'
        _textFees = '<h1>FBA Fees Breakdown</h1>'+ _textFees;
      }
      else {
        var _textFees = "";
        var _refFee;
        var _totalFee;

        var _feeList = xmlDoc.getElementsByTagName("FeeType");
        if (_feeList.length != 0) {
          if (flagEFN == true) {
            for (var i = 0; i < _feeList.length - 2; i++) {
              if (i == 1 || i == 2)
                continue;
              _textFees += _feeList[i].firstChild.nodeValue + ": " + getMoneySymbol() + xmlDoc.getElementsByTagName("FinalFee")[i].childNodes[3].firstChild.nodeValue + "<br />";
              _refFee = parseFloat(getPureNumber(_textFees));
            }
          }
          else {
            for (var i = 0; i < _feeList.length - 1; i++) {
              if (i == 1 || i == 2)
                continue;
              _textFees += _feeList[i].firstChild.nodeValue + ": " + getMoneySymbol() + xmlDoc.getElementsByTagName("FinalFee")[i].childNodes[3].firstChild.nodeValue + "<br />";
            }
          }
        }

        if (flagEFN == false) {
          var _textTotalFee = "";
          if (xmlDoc.getElementsByTagName("TotalFeesEstimate").length != 0) {
            _textTotalFee = xmlDoc.getElementsByTagName("TotalFeesEstimate")[0].childNodes[3].firstChild.nodeValue;
            _textFees += "TotalFBAFeesEstimate: " + getMoneySymbol() + _textTotalFee + "<br />";
          }
          _totalFee = parseFloat(_textTotalFee);
        }
        else {
          _totalFee = _refFee;
        }

        if (localStorage['fixedPrepFee'] != '' && isNumber(localStorage['fixedPrepFee'])) {
            var fixedPrepFee = parseFloat(localStorage['fixedPrepFee']);
            _textFees += '<b>Fixed Prep. Fee: </b>' + getMoneySymbol() + fixedPrepFee.format(2) + '<br />';
            _totalFee += fixedPrepFee;
        }

        if (country == 'com') {
            console.log(weight);
            if (localStorage['inboundShipping'] != '' && isNumber(localStorage['inboundShipping'])) {
                var inboundShipping = parseFloat(localStorage['inboundShipping'])*weight;
                _textFees += '<b>Inbound Shipping: </b>' + getMoneySymbol() + inboundShipping.format(2) + '<br />';
                _totalFee += inboundShipping;
            }
        }

        if (flagEFN == false) {
          if (localStorage['feeAdjustment'] != '' && isNumber(localStorage['feeAdjustment'])) {
              var feeAdjustment = (getPureNumber(_totalFee)*parseFloat(localStorage['feeAdjustment']))/100;
              _textFees += '<b>FBA Fee adjustment: </b>' + getMoneySymbol() + feeAdjustment.format(2) + '<br />';
              _totalFee += feeAdjustment;
          }
        }

        totalFBAFee = _totalFee;  // not included EFN Fees

        if (flagEFN == true) {
          var _efnFee = getEFNFee();
          totalFBAFee += _efnFee;
          _textFees += '<b>EFN Fee: </b>' + getMoneySymbol() + _efnFee.format(2) + '<br />';

          if (localStorage['feeAdjustment'] != '' && isNumber(localStorage['feeAdjustment'])) {
              var feeAdjustment = (getPureNumber(_efnFee)*parseFloat(localStorage['feeAdjustment']))/100;
              _textFees += '<b>EFN Fee adjustment: </b>' + getMoneySymbol() + feeAdjustment.format(2) + '<br />';
              totalFBAFee += feeAdjustment;
          }
        }

        _textFees += '<b>Total Fees: </b>' +  getMoneySymbol() + getPureNumber(totalFBAFee).format(2);

        var _profit = (sellPrice - buyPrice) - totalFBAFee;
        _textFees += '<br /><br /><h2>Your profit is ' +  getMoneySymbol() + _profit.format(2) + '</h2>';

        if (localStorage['profitAdjustment'] != '' && isNumber(localStorage['profitAdjustment'])) {
            var profitAdjustment = (_profit*parseFloat(localStorage['profitAdjustment']))/100;
            _profit += profitAdjustment;
            _textFees += '<h2>Profit Adjusted to ' +  getMoneySymbol() + _profit.format(2) + '</h2>';
        }

        _textFees += '<h2>Your ROI is '+((_profit/buyPrice)*100).format(2)+'%</h2>'
        _textFees = '<h1>FBA Fees Breakdown</h1>'+ _textFees;
      }

      var createToggle = "<div class='efn'><label class='label-efn'><b>Estimate EFN Fees</b></label><div class='switch'><input id='cmn-toggle-1' class='cmn-toggle cmn-toggle-round' type='checkbox'><label for='cmn-toggle-1' class='label-switch'></label></div></div>";

      $('.result').html(_textFees);

      if (country == 'co.uk' || country == 'de' || country == 'fr' || country == 'es' || country == 'it' ) {

        $('.result').prepend(createToggle);

        if (flagEFN == true) {
          $("#cmn-toggle-1").prop("checked", true);
        }
        else {
          $("#cmn-toggle-1").prop("checked", false);
        }

        $("#cmn-toggle-1").click(function() {
          getFBAFees(asin, sellPrice, buyPrice);
          if (this.checked) flagEFN = true;
          else flagEFN = false;
        });
      }

      $('.calc').show();
      $('.loader-calc').hide();

      chrome.runtime.sendMessage({setHeight: $('body').outerHeight()}, function() {});
    },
    error: function( error ) {
      console.log( "error: " + JSON.stringify(error));
      alert('FBA fees could not be calculated.');
    }
  });
}

function getSalesRankAndWeight(asin) {

  var _action = "GetMatchingProductForId";
  var _today = new Date();
  timeStamp = ISODateString(_today);
  var _host = "";
  var _awsAccessKeyID = "";
  var _sellerID = "";
  var _mwsAuthToken = "";
  var _secretKey = "";

  switch(country) {
    case 'de':
    case 'fr':
    case 'es':
    case 'it':
    case 'co.uk':
      _host = hostType['co.uk'];
      _awsAccessKeyID = awsaccesskeyidType['co.uk'];
      _sellerID = selleridType['co.uk'];
      _mwsAuthToken = mwsauthtokenType['co.uk'];
      _secretKey = secretkeyType['co.uk'];
      break;
    case 'com':
    case 'ca':
    case 'com.mx':
      _host = hostType['com'];
      _awsAccessKeyID = awsaccesskeyidType['com'];
      _sellerID = selleridType['com'];
      _mwsAuthToken = mwsauthtokenType['com'];
      _secretKey = secretkeyType['com'];
      break;
    default:
      _host = hostType['co.uk'];
      _awsAccessKeyID = awsaccesskeyidType['co.uk'];
      _sellerID = selleridType['co.uk'];
      _mwsAuthToken = mwsauthtokenType['co.uk'];
      _secretKey = secretkeyType['co.uk'];
  }

  // important: parameter order
  var parameters = {
    //"ASINList.ASIN.1":Asin,
    "AWSAccessKeyId": _awsAccessKeyID,
    "Action": _action,
    "IdList.Id.1": asin,
    "IdType": "ASIN",
    "MWSAuthToken": _mwsAuthToken,
    "MarketplaceId": getCurrentMarketPlaceID(),
    "SellerId": _sellerID,
    "SignatureMethod":  signatureMethod,
    "SignatureVersion": signatureVersion,
    //"Signature": signature,
    "Timestamp":  timeStamp,
    "Version":  version
  };

  parameters = $.param( parameters );
  var StringToSign =  method+"\n"+_host+"\n"+uri+"\n"+parameters;

  signature = CryptoJS.HmacSHA256(StringToSign, _secretKey);
  signature = signature.toString(CryptoJS.enc.Base64);
  //Signature = encodeURIComponent(Signature);

  $.ajax({
    type: "POST",
    url: protocol + _host + uri,
    data: {

      "AWSAccessKeyId": _awsAccessKeyID,
      "Action": _action,
      "SellerId": _sellerID,
      "MWSAuthToken": _mwsAuthToken,
      "SignatureVersion": signatureVersion,
      "Timestamp":  timeStamp,
      "Version":  version,
      "Signature": signature,
      "SignatureMethod":  signatureMethod,
      "MarketplaceId": getCurrentMarketPlaceID(),
      "IdType": "ASIN",
      "IdList.Id.1": asin
    },
    dataType: "text",
    success: function( data ) {
      console.log( "success: " + data );

      if (window.DOMParser)
      {
        parser=new DOMParser();
        xmlDoc=parser.parseFromString(data,"text/xml");
      }

      var _salesRank = "";
      if (xmlDoc.getElementsByTagName("Rank").length != 0) {
        _salesRank = xmlDoc.getElementsByTagName("Rank")[0].childNodes[0].nodeValue;
      }

      var _weight = "";
      var _weightUnit = "";
      if (xmlDoc.getElementsByTagName("PackageDimensions").length != 0) {
        _weight = xmlDoc.getElementsByTagName("PackageDimensions")[0].childNodes[3].firstChild.nodeValue;
        _weightUnit = xmlDoc.getElementsByTagName("PackageDimensions")[0].childNodes[3].getAttribute("Units");
      }

      weight = parseFloat(_weight);

      var gram = Math.round(weight/0.0022046);
      var kg = (weight/2.2046).toFixed(1);
      if (gram < 1000) {
        _weight = gram;
        _weightUnit = "g";
      }
      else {
        _weight = kg;
        _weightUnit = "Kg";
      }

      $('.page-result').append('<div class="label"><b>Sales Rank</b>: '+ _salesRank +'</div>');
      $('.page-result').prepend('<div class="label"><b>Weight</b>: '+_weight+' '+_weightUnit+'</div>');
      chrome.runtime.sendMessage({setHeight: $('body').outerHeight()}, function() {});

    },
    error: function( error ) {
      console.log( "error: " + JSON.stringify(error));
      alert('Connectivity error (lv1).');
    }
  });
}

function getEFNFee() {

  var gram = Math.round(weight/0.0022046);

  if (currencyRate == undefined) {
    currencyRate = 0.87;
  }

  if (gram >= 0 && gram <= 250)
    return country == 'co.uk' ? currencyRate * 3.57 : 3.57;
  else if(gram >= 251 && gram <= 500)
    return country == 'co.uk' ? currencyRate * 3.66 : 3.66;
  else if(gram >= 501 && gram <= 1000)
    return country == 'co.uk' ? currencyRate * 4.23 : 4.23;
  else if(gram >= 1001 && gram <= 1500)
    return country == 'co.uk' ? currencyRate * 4.29 : 4.29;
  else if(gram >= 1501 && gram <= 2000)
    return country == 'co.uk' ? currencyRate * 4.35 : 4.35;
  else if(gram >= 2001 && gram <= 3000)
    return country == 'co.uk' ? currencyRate * 5.28 : 5.28;
  else if(gram >= 3001 && gram <= 4000)
    return country == 'co.uk' ? currencyRate * 5.44 : 5.44;
  else if(gram >= 4001 && gram <= 5000)
    return country == 'co.uk' ? currencyRate * 5.44 : 5.44;
  else if(gram >= 5001 && gram <= 6000)
    return country == 'co.uk' ? currencyRate * 5.52 : 5.52;
  else if(gram >= 6001 && gram <= 7000)
    return country == 'co.uk' ? currencyRate * 5.52 : 5.52;
  else if(gram >= 7001 && gram <= 8000)
    return country == 'co.uk' ? currencyRate * 5.65 : 5.65;
  else if(gram >= 8001 && gram <= 9000)
    return country == 'co.uk' ? currencyRate * 5.65 : 5.65;
  else if(gram >= 9001 && gram <= 10000)
    return country == 'co.uk' ? currencyRate * 5.65 : 5.65;
  else if(gram >= 10001 && gram <= 11000)
    return country == 'co.uk' ? currencyRate * 5.65 : 5.65;
  else if(gram >= 11001 && gram <= 12000)
    return country == 'co.uk' ? currencyRate * 5.66 : 5.66;
  else
    return country == 'co.uk' ? currencyRate * 5.66 : 5.66;
}

function getCurrencyRate(currency_from, currency_to) {

  var yql_base_url = "https://query.yahooapis.com/v1/public/yql";
  var yql_query = 'select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20("'+currency_from+currency_to+'")';
  var yql_query_url = yql_base_url + "?q=" + yql_query + "&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";

  var rate = 0;

  $.get( yql_query_url, function( data ) {
    rate = data.query.results.rate.Rate;
    currencyRate = rate;
    console.log("currencyRate = " + currencyRate);
  });
}
/*
0 - 250 g	¢3.57
251 - 500 g	¢3.66
501 - 1,000 g	¢4.23
1,001 - 1,500 g	¢4.29
1,501 - 2,000 g	¢4.35
2,001 - 3,000 g	¢5.28
3,001 - 4,000 g	¢5.44
4,001 - 5,000 g	¢5.44
5,001 - 6,000 g	¢5.52
6,001 - 7,000 g	¢5.52
7,001 - 8,000 g	¢5.65
8,001 - 9,000 g	¢5.65
9,001 - 10,000 g	¢5,65
10,001 - 11,000 g	¢5.65
11,001 - 12,000 g	¢5.66
*/
