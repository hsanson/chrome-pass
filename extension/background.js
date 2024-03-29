function getCredentials(url, tabId) {
  chrome.runtime.sendNativeMessage('com.piaotech.chrome.extension.pass',
      { action: "get-list", url: url },
      function(response) {
        if(response) {
          if(tabId) {
            chrome.tabs.sendMessage(tabId, { action: "fill-list", url: response.url, credentials: response.credentials });
          } else {
            chrome.runtime.sendMessage({ action: "fill-list", url: response.url, credentials: response.credentials });
          }
        } else {
          chrome.runtime.sendMessage({ action: "native-app-error" , msg: "No response from native app"});
        }
      }
  );
}

function getPass(root, user) {
  chrome.runtime.sendNativeMessage('com.piaotech.chrome.extension.pass',
      { action: "get-creds", user: user, path: root + "/" + user },
      function(response) {
        if(response) {
          if(response.action == "fill-creds") {
            chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
              var currentTab = tabs[0];
              chrome.tabs.sendMessage(currentTab.id, { action: "fill-creds", creds: response.creds});
            });
            chrome.runtime.sendMessage({ action: "close-popup" });
          } else {
            console.log("Error " + response.msg);
            chrome.runtime.sendMessage({ action: "native-app-error", msg: response.msg });
          }
        } else {
          console.log("Native app returned no response");
          chrome.runtime.sendMessage({ action: "native-app-error", msg: "No response from native app" });
        }
      }
  );
}

chrome.runtime.onMessage.addListener(function(msg, sender, response) {
  switch(msg.action) {
    case "get-list":
      if(sender.tab) {
        getCredentials(sender.tab.url, sender.tab.id);
      } else {
        getCredentials(msg.url);
      }
      return false;
    case "get-creds":
      getPass(msg.root, msg.user);
      return false;
  }
});
