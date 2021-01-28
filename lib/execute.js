const { VM } = require('vm2');

// Executes a given expression in a sandbox, adding state in to the global
// object.
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
