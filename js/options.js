jQuery(document).ready(function($){
    chrome.runtime.sendMessage({setHeight: $('body').outerHeight()}, function() {});

    $('body').on('click', '.tab-normal', function(){
        var toHide = $('.tab-selected').attr('rel');
        var toShow = $('.tab-normal').attr('rel');

        $('.'+toHide).hide();
        $('.'+toShow).show();

        $('.tab-normal').addClass('tab-selected2').removeClass('tab-normal');
        $('.tab-selected').addClass('tab-normal').removeClass('tab-selected');
        $('.tab-selected2').addClass('tab-selected').removeClass('tab-selected2');
    });

    if (localStorage['license']) {
        $('.tab-normal').click();
    }

    $('#license-key').val(localStorage['license']);

    $('#buy-license-key').click(function(){
        chrome.tabs.create({ url: 'https://fbawizard.co.uk/fee-calculator' });
    });

    $('#validate-license-key').click(function(){
        $('.loader-calc').show();
        $('.calc').hide();

        localStorage['license'] = $.trim($('#license-key').val());
        localStorage['time'] = 0;

        chrome.runtime.sendMessage({license: "1"}, function(response) {
            if (response.activeLicense == 1) {
                alert('License valid!');

                var part = window.location.href.split('?');
                part = part[1];

                if (part) {
                    window.location.href = chrome.extension.getURL("html/fbawizard.html")+'?'+part;
                } else {
                    window.close();
                }
            } else {
                alert('License not valid');
                $('.loader-calc').hide();
                $('.calc').show();
            }
        });
    });

    $('#fee-adjustment').val(localStorage['feeAdjustment']);
    $('#profit-adjustment').val(localStorage['profitAdjustment']);
    $('#inboud-shipping').val(localStorage['inboundShipping']);
    $('#fixed-prep-fee').val(localStorage['fixedPrepFee']);

    $('#save-settings').click(function(){
        localStorage['feeAdjustment'] = $('#fee-adjustment').val().replace(/,/g, '');
        localStorage['profitAdjustment'] = $('#profit-adjustment').val().replace(/,/g, '');
        localStorage['inboundShipping'] = $('#inboud-shipping').val().replace(/,/g, '');
        localStorage['fixedPrepFee'] = $('#fixed-prep-fee').val().replace(/,/g, '');

        alert('Saved!')
    });

    $("#cmn-toggle-1").click(function() {
      localStorage['convertEUR2GBP'] = $("#cmn-toggle-1").prop("checked");
      getCurrencyRate("EUR", "GBP");
    });

    if (localStorage['convertEUR2GBP'] == "true") {
      $("#cmn-toggle-1").prop("checked", true);
    }
    else {
      $("#cmn-toggle-1").prop("checked", false);
    }

});

function getCurrencyRate(currency_from, currency_to) {

  var yql_base_url = "https://query.yahooapis.com/v1/public/yql";
  var yql_query = 'select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20("'+currency_from+currency_to+'")';
  var yql_query_url = yql_base_url + "?q=" + yql_query + "&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";

  var rate = 0;

  $.get( yql_query_url, function( data ) {
    rate = data.query.results.rate.Rate;
    localStorage['currencyRate'] = rate;
    console.log("currencyRate = " + rate);
  });
}
