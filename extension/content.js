
function Form(user, pass) {
  this.user = user;
  this.pass = pass;
}

Form.prototype = {

  fillPass: function(user, pass) {

    if(this.user != undefined) {
      this.user.value = user;
    }

    if(this.pass != undefined) {
      this.pass.value = pass;
      this.copyToClipboard(pass);
    }

  },

  copyToClipboard: function(txt) {
    const input = document.createElement('input');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = txt;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
}

function findForms() {

  if(document.baseURI.includes("amazon")) {
    return findAmazonEmailForms();
  }

  return findPasswordForms();
}

function findPasswordForms() {
  var forms = [];
  var passInputs = document.querySelectorAll("input[type=password]");

  for(var i = 0; i < passInputs.length; i++) {

    var seenForms = []
    var passInput = passInputs[i];
    var formElement = passInput.form;

    if(formElement && (seenForms.indexOf(formElement) == -1)) {
      var userInput = formElement.querySelector("input[type=text], input[type=email], input:not([type])");
      forms.push(new Form(userInput, passInput));
    }

    seenForms.push(formElement);
  }

  return forms;
}

// Special case for amazon market and aws login pages.
function findAmazonEmailForms() {

  var forms = [];
  var emailInput = document.querySelector("input[type=email]");

  if(emailInput) {
    forms.push(new Form(emailInput, undefined));
  }

  var passwordInput = document.querySelector("input[type=password]");

  if(passwordInput) {
    forms.push(new Form(undefined, passwordInput));
  }

  // Special input for AWS root login
  var resolvingInput = document.querySelector("input[id=resolving_input]");

  if(resolvingInput) {
    forms.push(new Form(resolvingInput, undefined));
  }

  // Special input for AWS signin
  var nameInput = document.querySelector("input[name=username]");

  if(nameInput && passwordInput) {
    forms.push(new Form(nameInput, passwordInput));
  }

  return forms;
}

chrome.runtime.onMessage.addListener(function(msg) {
  switch(msg.action) {
    case "fill-pass":
      var forms = findForms();
      for(var i = 0; i < forms.length; i++) {
        forms[i].fillPass(msg.user, msg.pass);
      }
      break;
    case "native-app-error":
      console.log("chrome-pass: error " + response.msg);
      break;
  }
});

