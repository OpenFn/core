const { VM } = require('vm2');

// Handler for wrapping a compiled expression in an IIFE and a Promise,
// ensuring an executed expression meets the expected return type (Promise)
// and is executed in an isolated enviroment with all language pack functions
// available on the root.
function Execute({ expression, state, sandbox }) {
  if (!expression) {
    throw new Error('Cannot execute without an expression.');
  }
  if (!state) {
    throw new Error('Cannot execute without an initial state.');
  }

  return new VM({
    sandbox: Object.assign({ state }, sandbox),
  }).run(expression);
}

module.exports = Execute;
