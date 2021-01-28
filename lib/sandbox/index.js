const { VM } = require('vm2');
const { disabledConsole } = require('../utils');

// Get all the globals from an empty VM2 sandbox
const VMGlobals = new VM({}).run(
  `Object.getOwnPropertyNames(this).reduce((obj, item) => {
    obj[item] = this[item];
    return obj;
  }, {});`
);

function buildSandbox(
  opts = { noConsole: false, testMode: false, extensions: [] }
) {
  // Create an object to be used as an extension to the VMs root object.

  return Object.assign(
    {
      console: opts.noConsole ? disabledConsole : console, // --nc or --noConsole
      testMode: opts.testMode, // --t or --test
      setTimeout, // We allow as Erlang will handle killing long-running VMs.
    },
    ...opts.extensions
  );
}

module.exports = { buildSandbox, VMGlobals };
