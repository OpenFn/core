var fs = require('fs');
var path = require('path');
var Template = require('./template');

var moment = require('moment');

var header = function(options) {
 return Template('header.hbs.js', {
    date: moment().format("YYYY-MM-DD HH:MM:ss"),
    language: options.language,
    languageVersion: "0.0.3"
  });
};

var body = function(options) {
  languagePack = options.languagePack;
  source = fs.readFileSync(options.file, 'utf8');

  return Template('body.hbs.js', {
    expressions: Object.keys(languagePack.adaptors.default),
    adaptorModule: "language-salesforce/lib/adaptor",
    source: source
  });
};

function Compile(options) {

  var languagePack = require('language-' + options.languageName);
  var file = options.file;

  process.stdout.write(header(options));
  process.stdout.write(
    body({
      languagePack: languagePack,
      file: file
    })
  );
 
};

module.exports = Compile;

  
