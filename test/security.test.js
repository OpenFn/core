const assert = require('assert');
const Execute = require('../lib/execute');

describe('security', () => {
  it('should allow access to the console object', () => {
    const result = Execute({
      expression: 'fn(() => { console.log(">> jam"); return 1 });',
      state: {},
      sandbox: {
        fn: f => f(),
      },
    });
    assert.equal(result, 1);
  });

  it('should not allow access to the process object', () => {
    assert.throws(
      () => Execute({ expression: 'process.env', state: {} }),
      /process is not defined/
    );
  });

  it('should not allow access to require', () => {
    assert.throws(
      () => Execute({ expression: 'require("node:fs")', state: {} }),
      /require is not defined/
    );
  });
});
