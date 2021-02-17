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

function fillAppleDeveloperForms(user, pass) {

  var userInput = document.querySelector("#account_name_text_field");

  if(userInput) {
    userInput.value = user;
  }

  var passwordInput = document.querySelector("input[type=password]");

  if(passwordInput) {
    passwordInput.value = pass;
    focus(passwordInput);
  }
}

function fillAmazonLoginForm(user, pass) {

  var emailInput = document.querySelector("input[type=email]");

  if(emailInput) {
    emailInput.value = user;
  }

  var passwordInput = document.querySelector("input[type=password]");

  if(passwordInput) {
    passwordInput.value = pass;
    focus(passwordInput);
  }
}

function fillAwsLoginForm(path, user, pass) {

  // Special input for AWS root login
  var resolvingInput = document.querySelector("input[id=resolving_input]");

  if(resolvingInput) {
    resolvingInput.value = user;
  }

  var nameInput = document.querySelector("input[name=username]");

  if(nameInput) {
    nameInput.value = user;
  }

  var passwordInput = document.querySelector("input[type=password]");

  if(passwordInput) {
    passwordInput.value = pass;
    focus(passwordInput);
  }

  // Account input box for IAM login
  var accountInput = document.querySelector("input[name=account]");

  if(accountInput) {
    accountInput.value = path.split(/[\\/]/).pop()
      .replace(/.?signin.aws.amazon.com/,"");
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

// Heavy work function that finds login forms and fills them with the
// credentials.
function fillForm(path, user, pass) {

  copyToClipboard(pass);

  if(document.baseURI.includes("signin.aws.amazon.com")) {
     fillAwsLoginForm(path, user, pass);
  } else if(document.baseURI.includes("amazon")) {
     fillAmazonLoginForm(user, pass);
  } else if(document.baseURI.includes("idmsa.apple.com")) {
     fillAppleDeveloperForms(user, pass);
  } else {
    fillDefaultForm(user, pass);
  }
}

chrome.runtime.onMessage.addListener(function(msg) {
  switch(msg.action) {
    case "fill-pass":
      fillForm(msg.path, msg.user, msg.pass);
      break;
    case "native-app-error":
      console.log("chrome-pass: error " + response.msg);
      break;
  }
});
