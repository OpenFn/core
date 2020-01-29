const assert = require('assert');
const Execute = require('../lib/execute');

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
        extensions: { add: num => state => { return state + num } }
      })
      assert.equal(result, 2)

    })
  })
})
