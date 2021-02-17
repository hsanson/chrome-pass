function fillDefaultForm(user, pass) {

  var passInputs = document.querySelectorAll("input[type=password]");

  for(var i = 0; i < passInputs.length; i++) {

    var seenForms = []
    var passInput = passInputs[i];
    var formElement = passInput.form;

    if(formElement && (seenForms.indexOf(formElement) == -1)) {
      var userInput = formElement.querySelector("input[type=text], input[type=email], input:not([type])");

      if(userInput && passInput) {
        userInput.value = user;
        passInput.value = pass;
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
