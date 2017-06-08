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
      regexp = new RegExp(pattern.split('').join('.*?'), 'i');
    } catch(e) {
      return;
    }

    for (var i=0; i < groups.length; i++) {

      var group = groups[i];
      var options = group.getElementsByTagName("option");

      for (var j=0; j < options.length; j++) {
        var option = options[j];
        var path   = option.getAttribute("data-path")

        if (regexp.test(path)) {
          option.className = "";
        } else {
          option.className = "hidden";
        }
      }

      // If all options in a group do not match then hide the group itself.
      var hiddenCount = group.querySelectorAll("option.hidden").length;

      if (hiddenCount == options.length) {
        group.className = "hidden";
      } else {
        group.className = "";
      }
    }

  }
}
