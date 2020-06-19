const { VM } = require('vm2');

// Handler for wrapping a compiled expression in an IIFE and a Promise,
// ensuring an executed expression meets the expected return type (Promise)
// and is executed in an isolated enviroment with all language pack functions
// available on the root.
function Execute({ expression, state, extensions }) {
  if (!expression) {
    throw new Error('Cannot execute without an expression.');
  }
  if (!state) {
    throw new Error('Cannot execute without an initial state.');
  }

  const debug = `│ ◰ ◱ ◲ ◳  OpenFn/core running on Node ${process.version} with ${extensions.__adaptorVersion} │`;
  console.log('╭' + '─'.repeat(debug.length - 2) + '╮');
  console.log(debug);
  console.log('╰' + '─'.repeat(debug.length - 2) + '╯');

  return new VM({
    sandbox: Object.assign({ state }, extensions),
  }).run(expression);
}

module.exports = Execute;
