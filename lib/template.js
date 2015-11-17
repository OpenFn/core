var Handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');

var templatesPath = path.join(
  path.dirname(fs.realpathSync(__filename)),
  "../templates/"
);
  
function Template(path, locals) {

  var source = fs.readFileSync(templatesPath + path, 'utf8');
  var template = Handlebars.compile(source);
  return template(locals);

}

module.exports = Template;

