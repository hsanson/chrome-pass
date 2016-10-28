
function Form(user, pass) {
  this.user = user;
  this.pass = pass;
}

Form.prototype = {

  fillPass: function(user, pass) {
    this.user.value = user;
    this.pass.value = pass;
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
      var userInput = formElement.querySelector("input[type=text], input[type=email], input:not([type])");
      forms.push(new Form(userInput, passInput));
    }

    seenForms.push(formElement);
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
    case "error":
      console.log("chrome-pass: error " + response.msg);
      break;
  }
});

