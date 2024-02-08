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

// Fill MFA TOTP code
function fillTOTP(code) {

  if(!code) { return; }

  if(document.baseURI.includes("zoom.us")) {
    var zoomInput = document.querySelector("[class=form-masked-pin]");

    if(zoomInput) {
      writeValueWithEvents(zoomInput, code);
    }
  } else {
    // Most services that require MFA have a form with a single numeric input.
    var numericInputs = document.querySelectorAll("input[inputmode=numeric]")

    for(var i = 0; i < numericInputs.length; i++) {
      var input = numericInputs[i];
      writeValueWithEvents(input, code);
    }
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

      if(userInput) {
        writeValueWithEvents(userInput, user);
      }

      if(passInput) {
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

  const password = creds["pass__password"];
  const username = creds["pass__user"];
  const totp = creds["otpauth"];

  fillTOTP(totp);

  // AWS signin forms has two text inputs for username and account. Here we
  // specifically fill username.
  if(document.baseURI.includes("signin.aws.amazon.com")) {

    // First page asking for root or IAM account has a resolving_input field
    // where we enter either an email for root accounts or a 12 digit account
    // number for IAM accounts. The only way to differentiate them is using the
    // placeholder value of the field.
    var input = document.querySelector("input[id=resolving_input]");

    if(input) {
      if(input.placeholder === "") {
        // If placeholder is empty, the form expects the account 12 digit id.
        writeValueWithEvents(input, creds["account"]);
      } else {
        // If placeholder is not empty, the form expects a root user email.
        writeValueWithEvents(input, username);
      }
    }

    var userInput = document.querySelector("input[id=username]");

    if(userInput) {
      writeValueWithEvents(userInput, username);
    }

    var passInput = document.querySelector("input[type=password]");

    if(passInput) {
      writeValueWithEvents(passInput, password);
    }
  } else {
    fillDefaultForm(username, password);
  }

  for(const [id, content] of Object.entries(creds)) {

    // Skip special keys.
    if(["pass__password", "pass__user", "otpauth"].includes(id)) {
      continue;
    }

    var input = document.querySelector("input[id=" + id + "]");
    var value = content;

    // Replace special values.
    if(content == "pass__user") { value = username; }
    if(content == "pass__password") { value = password; }
    if(content == "otpauth") { value = totp; }

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
