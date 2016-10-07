document.addEventListener('DOMContentLoaded', function() {

  chrome.runtime.onMessage.addListener(function(msg, sender, response) {
    switch(msg.action) {
      case "fill-creds":
        var select = document.getElementById("passSelect");
        var search = document.getElementById("passSearch");
        var nativeError = document.getElementById("nativeError");

        nativeError.className = "title hidden";

        select.addEventListener("change", function(event) {
          option = select.options[select.selectedIndex];
          chrome.runtime.sendMessage({
            action: "get-pass",
            root: option.getAttribute("data-root"),
            url: option.getAttribute("data-url"),
            user: option.value
          });
          window.close();
        });

        search.addEventListener("input", function(event) {
          filter.set(search.value);
        });

        var optGroups = {};
        var credentials = msg.credentials;

        for(var i = 0; i < credentials.length; i++) {
          var root = credentials[i][0];
          var url = credentials[i][1];
          var user = credentials[i][2];

          if (url in optGroups) {
            var group = optGroups[url];
          } else {
            var group = document.createElement("optgroup");
            group.label = url;
            optGroups[url] = group;
            select.appendChild(group);
          }

          var option = document.createElement("option");
          option.value = credentials[i][2];
          option.text = credentials[i][2];
          option.setAttribute("data-root", credentials[i][0]);
          option.setAttribute("data-url", credentials[i][1]);
          group.appendChild(option);
        }

        var filter = new filterlist(select);
        search.focus();
        break;

      case "native-app-error":
        console.log("Got native app error");
        var nativeError = document.getElementById("nativeError");
        nativeError.className = "error";
        break;
    }

  });

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currentTab = tabs[0];
    chrome.runtime.sendMessage({ action: "get-creds", url: currentTab.url });
  })

}, false);


