const assert = require('assert');
const Compile = require('../../lib/compile');
const {
  verify,
  wrapRootExpressions,
  callFunction,
  wrapIIFE,
  banClasses,
} = require('../../lib/compile/transforms');

describe('Compile', () => {
  it("throws an error when a transform doesn't return the ast", () => {
    assert.throws(() => {
      new Compile('', [function () {}]);
    }, /A transform unexpectedly returned undefined/);
  });
});

describe('Transforms', () => {
  function assertCodeEqual(compile, expected) {
    return assert.equal(compile.toString(), expected);
  }

  describe('verify', () => {
    it('checks the scope of all call expressions', () => {
      let result;

      result = new Compile(`noExist()`, [verify({ sandbox: {} })]);
      assert(result.errors.length > 0);

      result = new Compile(`exist()`, [verify({ sandbox: { exist: null } })]);
      assert(result.errors.length == 0);
    });

    it('returns the code unmodified', () => {
      result = new Compile(`foo()`, [verify({ sandbox: { foo: null } })]);
      assertCodeEqual(result, 'foo()');
    });

    it('specifies missing functions', () => {
      result = new Compile(`noExist()`, [verify({ sandbox: {} })]);
      assert(result.errors.length > 0);
      assert(result.errors[0].message == 'Function not available.');
    });
  });

  describe('wrapRootExpresssions', () => {
    it('wraps all root expressions in a function', () => {
      result = new Compile(`foo();bar();baz();`, [
        wrapRootExpressions('execute'),
      ]);
      assertCodeEqual(result, 'execute(foo(), bar(), baz());');
    });

    it("won't break if the last character is a space", () => {
      const code = `each() `;
      result = new Compile(code, [wrapRootExpressions('execute')]);
      assertCodeEqual(result, 'execute(each());');
    });
  });

  describe('callFunction', () => {
    it('calls callExpression with indentifer', () => {
      result = new Compile(`execute(foo(), bar(), baz())`, [
        callFunction('execute', 'state'),
      ]);
      assertCodeEqual(result, 'execute(foo(), bar(), baz())(state)');
    });
  });

  describe('wrapIIFE', () => {
    it('wraps the body in an IIFE', () => {
      result = new Compile(`execute(foo(), bar(), baz())`, [wrapIIFE()]);
      assertCodeEqual(
        result,
        [
          '(function() {',
          '  return execute(foo(), bar(), baz());',
          '})();',
        ].join('\n')
      );
    });
  });

  describe('banClasses', () => {
    it('throws an error if a class statement is detected', () => {
      assert.throws(() => {
        new Compile('class Naughty {}', [banClasses()]);
      }, /Illegal class statement/);
    });
  });
});
