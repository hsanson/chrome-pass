
function Form(user, pass) {
  this.user = user;
  this.pass = pass;
}

Form.prototype = {

  fillPass: function(user, pass) {
    this.user.value = user;
    this.pass.value = pass;
    this.copyToClipboard(pass);
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
  var forms = [];
  var passInputs = document.querySelectorAll("input[type=password]");

  for(var i = 0; i < passInputs.length; i++) {

    var seenForms = []
    var passInput = passInputs[i];
    var formElement = passInput.form;

    if(formElement && (seenForms.indexOf(formElement) == -1)) {
      var userInput = formElement.querySelector(getSelector());
      forms.push(new Form(userInput, passInput));
    }

    seenForms.push(formElement);
  }

  return forms;
}

// Returns the CSS selectors to find the user input field in the form. Some
// pages have non-standard forms that require special selectors to get the
// correct field.
function getSelector() {

  // AWS root and IAM signin page
  if(document.baseURI.includes("signin.aws.amazon.com")) {
    return "input[type=email],input[name=username]";
  }

  // Default CSS selector
  return "input[type=text], input[type=email], input:not([type])";
}


chrome.runtime.onMessage.addListener(function(msg) {
  switch(msg.action) {
    case "fill-pass":
      var forms = findForms();
      for(var i = 0; i < forms.length; i++) {
        forms[i].fillPass(msg.user, msg.pass);
      }
      break;
    case "error":
      console.log("chrome-pass: error " + response.msg);
      break;
  }
});

