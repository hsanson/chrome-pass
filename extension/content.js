function focus(ele) {
  setTimeout(function() {
    ele.focus();
  }, 0);
}

// Helper method to genearate fake events. Needed for some javascript heavy
// forms that won't work unles these events are triggered.
//
// Taken from passff
// https://github.com/passff/passff/blob/master/src/modules/page.js
function createFakeEvent(typeArg) {
  if (['keydown', 'keyup', 'keypress'].includes(typeArg)) {
    return new KeyboardEvent(typeArg, {
      'key': ' ',
      'code': ' ',
      'charCode': ' '.charCodeAt(0),
      'keyCode': ' '.charCodeAt(0),
      'which': ' '.charCodeAt(0),
      'bubbles': true,
      'composed': true,
      'cancelable': true
    });
  } else if (['input', 'change'].includes(typeArg)) {
    return new InputEvent(typeArg, {
      'bubbles': true,
      'composed': true,
      'cancelable': true
    });
  } else if (['focus', 'blur'].includes(typeArg)) {
    return new FocusEvent(typeArg, {
      'bubbles': true,
      'composed': true,
      'cancelable': true
    });
  } else {
    log.error("createFakeEvent: Unknown event type: " + typeArg);
    return null;
  }
}

function writeValueWithEvents(input, value) {
  input.value = value;
  for (let action of ['focus', 'keydown', 'keyup', 'keypress',
    'input', 'change', 'blur']) {
    input.dispatchEvent(createFakeEvent(action));
    input.value = value;
  }
}

// Uses heuristics to try figuring out the login form password and
// username/email input fields.
function fillDefaultForm(user, pass) {

  var passInputs = document.querySelectorAll("input[type=password]");

  for(var i = 0; i < passInputs.length; i++) {

    var seenForms = []
    var passInput = passInputs[i];
    var formElement = passInput.form;

    if(formElement && (seenForms.indexOf(formElement) == -1)) {
      var userInput = formElement.querySelector("input[type=text], input[type=email], input:not([type])");

      if(userInput && passInput) {
        writeValueWithEvents(userInput, user);
        writeValueWithEvents(passInput, pass);
        focus(passInput);
      }
    }

    seenForms.push(formElement);
  }
}

// Helper method to copy the password to clipboard.
function copyToClipboard(txt) {
  const input = document.createElement('input');
  input.style.position = 'fixed';
  input.style.opacity = 0;
  input.value = txt;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

function fillForm(creds) {

  fillDefaultForm(creds["pass__user"], creds["pass__password"])

  // AWS signin forms has two text inputs for username and account. Here we
  // specifically fill username.
  if(document.baseURI.includes("signin.aws.amazon.com")) {
    var input = document.querySelector("input[id=username]");
    writeValueWithEvents(input, creds["pass__user"]);
  }

  // As usual Apple overcomplicates things
  if(document.baseURI.includes("idmsa.apple.com")) {

    var userInput = document.querySelector("#account_name_text_field");

    if(userInput) {
      writeValueWithEvents(userInput, creds["pass__user"]);
    }

    var passwordInput = document.querySelector("input[type=password]");

    if(passwordInput) {
      writeValueWithEvents(passwordInput, creds["pass__password"]);
      focus(passwordInput);
    }
  }

  for(const [key, value] of Object.entries(creds)) {
    var input = document.querySelector("input[name=" + key + "]");

    if(input != null) {
      writeValueWithEvents(input, value);
    }
  }
}

chrome.runtime.onMessage.addListener(function(msg) {
  switch(msg.action) {
    case "fill-pass":
      fillForm(msg.creds);
      break;
    case "native-app-error":
      console.log("chrome-pass: error " + response.msg);
      break;
  }
});
