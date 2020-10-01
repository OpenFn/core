const assert = require('assert');
const Execute_noCLI = require('../lib/execute_noCLI');

describe("Execute_noCLI", () => {
    it("expects an expression", () => {
        assert.throws(
            () => { Execute_noCLI() },
            /Cannot execute without an expression./
        )
    })

    it("expects an initial state", () => {
        assert.throws(
            () => { Execute_noCLI("foo") },
            /Cannot execute without an initial state./
        )
    })

    describe("when given an expression and state", () => {
        it("returns", async () => {
            let result = await Execute_noCLI(
                `add(1)`,
                {"num":1},
                { add: num => state => {
                        return state.num + num } }
            )
            assert.equal(result, 2)
        })
    })



})