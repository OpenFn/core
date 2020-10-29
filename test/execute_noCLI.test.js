const assert = require('assert');
const { Execute, Execute_noCLI } = require('../lib/execute_noCLI');

describe('Execute_noCLI', () => {
    it('expects an expression', () => {
        assert.throws(() => {
            Execute();
        }, /Cannot execute without an expression./);
    });

    it('expects an initial state', () => {
        assert.throws(() => {
            Execute({ code: 'foo' });
        }, /Cannot execute without an initial state./);
    });

    describe('when given an expression and state', () => {
        it('returns', async () => {
            let result = await Execute(`add(1)(state)`, 1, {
                add: num => state => {
                    return state + num;
                }
            });
            assert.equal(result, 2);
        });
    });
});
