var fs = require('fs');

function getHandlers(adaptor) {
  return Object.keys(adaptor).map(function(key) {
    return adaptor[key]
  })
}

function Inject(adaptor, f) {
  // Get the functions for all the keys in the adaptor
  // [[Function], [Function], ...]
  var handlers = getHandlers(adaptor)

  // Create a new Function with arguments in order and matching the names
  // of the adaptor.
  //
  // new Function('foo', 'bar', 'foo(bar())')
  //
  // Then call the new function with the handlers in order.
  return new Function(Object.keys(adaptor), f)
    .apply(null, handlers)
}


function Execute(options) {
  var languageAdaptor = options.language.split('/')
  var Adaptor = require('language-' + languageAdaptor[0])[ languageAdaptor[1] || 'default' ]

  var configuration = JSON.parse(fs.readFileSync( options.configuration)) 
  var data          = JSON.parse(fs.readFileSync( options.data)) 
  var content       = fs.readFileSync(options.expression)

  var state = {
    configuration: configuration,
    data: data
  }

  Inject(Adaptor, 'return execute(' + content + ')')(state).
    then(function(state) {
      console.log(JSON.stringify(state, null, 2));
    })
    .catch(function(err) {
      console.error(err);
      process.exit(1)
    })
  
}

module.exports = Execute
