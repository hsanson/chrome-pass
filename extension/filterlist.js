/**
 * Simple select tag filtering based on regexp.
 */
function filterlist(selectobj) {

  this.selectobj = selectobj;

  this.reset = function() {
    this.set('');
  }

  this.set = function(pattern) {

    var index=0, regexp, e;
    var groups = this.selectobj.getElementsByTagName("optgroup");

    if (!this.selectobj) return;
    if (!this.selectobj.options) return;

    try {
      regexp = new RegExp(pattern, 'i');
    } catch(e) {
      return;
    }

    for (var i=0; i < groups.length; i++) {

      var group = groups[i];
      var options = group.getElementsByTagName("option");

      for(var j = 0; j < options.length; j++) {
        var option = options[j];
        var url    = option.getAttribute("data-url");
        var user   = option.value;

        // If a single match is found the whole group is displayed.
        if (regexp.test(user) || regexp.test(url)) {
          group.className = "";
          break;
        }

        // If no match is found then the group is hidden.
        group.className = "hidden"
      }
    }

  }

}
