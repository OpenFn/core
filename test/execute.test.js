const assert = require('assert');
const Execute = require('../lib/execute');
const vm = require('vm');

describe("Execute", () => {
  it("expects an expression", () => {
    assert.throws(
      () => { Execute({}) },
      /Cannot execute without an expression./
    )
  })

  it("expects an initial state", () => {
    assert.throws(
      () => { Execute({ expression: "foo" }) },
      /Cannot execute without an initial state./
    )
  })

  describe("when given an expression and state", () => {
    it("returns", () => {
      let result = Execute({
        expression: `add(1)(state)`,
        state: 1,
        sandbox: { add: num => state => { return state + num } }
      })
      assert.equal(result, 2)

    })
  })
})

describe("Testing stuff", () => {
  it("thing", () => {

    Promise.resolve(new Promise((resolve, reject) => {
      reject('foo')
    })).then((res) => {
      // not called
      assert(res, 'foo')
    }).catch(err => assert.equal('foo'))

  })

  it("regexes", () => {

    let matches;
    let regex = /([\.\/\w-]+)(\.[\w]+)$/;

    matches = "language-salesforce.Adaptor".match(regex);
    assert.deepEqual(matches.slice(1,3), [ 'language-salesforce', '.Adaptor' ])

    matches = "./language-salesforce.Adaptor".match(regex);
    assert.deepEqual(matches.slice(1,3), [ './language-salesforce', '.Adaptor' ])

    matches = "./path/to/language-salesforce.Adaptor".match(regex);
    assert.deepEqual(matches.slice(1,3), [ './path/to/language-salesforce', '.Adaptor' ])
  })})
