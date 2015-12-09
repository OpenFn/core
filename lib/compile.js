var fs = require('fs');
var path = require('path');
var Template = require('./template');

var moment = require('moment');

var header = function(options) {
 return Template('header.hbs.js', {
    date: moment().format("YYYY-MM-DD HH:MM:ss"),
    language: options.language,
    languageVersion: "0.0.4"
  });
};

var body = function(options) {
  languagePack = options.languagePack;
  source = fs.readFileSync(options.file, 'utf8');

  return Template('body.hbs.js', {
    expressions: Object.keys(languagePack),
    moduleName: options.languageModule,
    adaptorName: options.languageAdaptor,
    source: source
  });
};

function Compile(options) {

  var languageModule = 'language-' + options.languageName.split('/')[0]
  var languageAdaptor = options.languageName.split('/')[1] || 'default'
  var languagePack = require(languageModule)[languageAdaptor];
  var file = options.file;

  return header(options).concat(
    body({
      languagePack: languagePack,
      languageModule: languageModule,
      languageAdaptor: languageAdaptor,
      file: file
    })
  )
 
};

module.exports = Compile;

  
