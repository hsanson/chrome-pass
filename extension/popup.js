function hasClass(element, cls) {
  return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function fillLoginForm(select) {
  option = select.options[select.selectedIndex];
  chrome.runtime.sendMessage({
    action: "get-pass",
    root: option.getAttribute("data-root"),
    url: option.getAttribute("data-url"),
    user: option.value
  });
}

document.addEventListener('DOMContentLoaded', function() {

  var search = document.getElementById("passSearch");
  var select = document.getElementById("passSelect");
  var nativeError = document.getElementById("nativeError");
  var filter = new filterlist(select);

  window.name = "chrome-pass-popup";

  nativeError.className = "title hidden";

  chrome.runtime.onMessage.addListener(function(msg, sender, response) {
    switch(msg.action) {
      case "fill-creds":

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
          option.setAttribute("data-path", credentials[i][0] + "/" + credentials[i][2]);
          group.appendChild(option);
        }

        // Set as selected the first non-hidden option in the select box.
        var option = select.querySelector("option:not(.hidden)")
        if(option) {
          option.selected = true;
        }

        search.focus();
        break;

      case "native-app-error":
        var nativeError = document.getElementById("nativeError");
        nativeError.className = "error";
        nativeError.innerText = msg.msg;
        break;
    }

  });

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currentTab = tabs[0];
    chrome.runtime.sendMessage({ action: "get-creds", url: currentTab.url });
  });

  search.addEventListener('keydown', function(e) {

    if(e.keyCode === 13) { /* Enter */
      e.preventDefault();
      fillLoginForm(select);
    }

    if(e.keyCode === 38 || (e.ctrlKey && e.keyCode === 75)) { /* Up Arrow or Ctrl-j */
      e.preventDefault();

      var nextIdx = Math.max(0, select.selectedIndex - 1);
      var nextOption = select.options[nextIdx];

      while(true) {

        nextOption = select.options[nextIdx];

        if(nextOption && !hasClass(nextOption, "hidden")) {
          break;
        }

        nextIdx = nextIdx - 1;

        if(nextIdx < 0) {
          nextIdx = select.selectedIndex;
          break;
        }

      }

      select.selectedIndex = nextIdx;
    }

    if(e.keyCode === 40 || (e.ctrlKey && e.keyCode === 74)) { /* Down Arrow or Ctrl-k*/
      e.preventDefault();

      var nextIdx = Math.max(0, select.selectedIndex + 1);
      var nextOption = select.options[nextIdx];

      while(true) {

        nextOption = select.options[nextIdx];

        if(nextOption && !hasClass(nextOption, "hidden")) {
          break;
        }

        nextIdx = nextIdx + 1;

        if(nextIdx > select.options.length - 1) {
          nextIdx = select.selectedIndex;
          break;
        }

      }

      select.selectedIndex = nextIdx;
    }

  });

  select.addEventListener("click", function(event) {
    fillLoginForm(select);
  });

  search.addEventListener("input", function(event) {

    filter.set(search.value);

    // Set as selected the first non-hidden option in the select box.
    var option = select.querySelector("option:not(.hidden)")
    if(option) {
      option.selected = true;
    }

  });

}, false);

