chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        chrome.tabs.create({ url: chrome.extension.getURL("html/options.html") });
    };
});

chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
    if (request.setHeight) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {setHeight: request.setHeight}, function(response) {});
        });
    }

    if (request.toggle) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {toggle: '1'}, function(response) {});
        });
    }

    if (request.license) {
        if (localStorage['license']) {
            var time = new Date();
            var expDate = new Date();
            if (localStorage['time']) {
                expDate.setTime(localStorage['time']);
            } else {
                expDate.setTime(0);
            }

            if (time.getTime() > expDate.getTime()) {
                $.post('https://api.gumroad.com/v2/licenses/verify', {product_permalink: 'PMKi',license_key: localStorage['license']}, function(data) {
                    if (data.success = true) {
                        localStorage['time'] = time.getTime() + (7 * 24 * 60 * 60 * 1000);
                        sendResponse({activeLicense: 1});
                    } else {
                        localStorage['time'] = 0;
                        sendResponse({activeLicense: 0});
                    }
                }).fail(function(){
                    localStorage['time'] = 0;
                    sendResponse({activeLicense: 0});
                });
            } else {
                sendResponse({activeLicense: 1});
            }
        } else {
            localStorage['time'] = 0;
            sendResponse({activeLicense: 0});
        }
    }

    if (request.createOptions) {
        chrome.tabs.create({ url: chrome.extension.getURL("html/options.html") });
    }

    if (request.createMarketPlace) {
      var asin = request.asin;

      if (request.createMarketPlace == "Germany") {
        chrome.tabs.create({ url: "https://www.amazon.de/dp/" + asin});
      } else if (request.createMarketPlace == "France") {
        chrome.tabs.create({ url: "https://www.amazon.fr/dp/" + asin});
      } else if (request.createMarketPlace == "Spain") {
        chrome.tabs.create({ url: "https://www.amazon.es/dp/" + asin});
      } else if (request.createMarketPlace == "Italy") {
        chrome.tabs.create({ url: "https://www.amazon.it/dp/" + asin});
      }
    }

    return true;
});
