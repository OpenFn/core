const assert = require('assert');
const { modulePath, writeJSON, readFile, formatCompileError } = require('../lib/utils');

describe("Utils", () => {

  it(".modulePath", () => {

    let matches;

    matches = modulePath("language-salesforce")
    assert.deepEqual(matches, {
      path: 'language-salesforce',
      memberName: null,
      isRelative: false
    })

    matches = modulePath("language-salesforce.Adaptor")
    assert.deepEqual(matches, {
      path: 'language-salesforce',
      memberName: 'Adaptor',
      isRelative: false
    })

    matches = modulePath("./language-salesforce.Adaptor")
    assert.deepEqual(matches, {
      path: './language-salesforce',
      memberName: 'Adaptor',
      isRelative: true
    })

    matches = modulePath("./path/to/language-salesforce.Adaptor")
    assert.deepEqual(matches, {
      path: './path/to/language-salesforce',
      memberName: 'Adaptor',
      isRelative: true
    })

    matches = modulePath("./path/to/language-salesforce-v1.0.0.Adaptor")
    assert.deepEqual(matches, {
      path: './path/to/language-salesforce-v1.0.0',
      memberName: 'Adaptor',
      isRelative: true
    })

    matches = modulePath("/path/to/language-salesforce-v1.0.0.Adaptor")
    assert.deepEqual(matches, {
      path: '/path/to/language-salesforce-v1.0.0',
      memberName: 'Adaptor',
      isRelative: false
    })

  })

  it(".writeJSON", () => {
    return writeJSON('/tmp/output.json', {a: 1})
      .then(() => readFile('/tmp/output.json'))
      .then((str) => assert.deepEqual({a: 1}, JSON.parse(str)))
  })

  it(".formatCompileError", () => {
    let expected = [
    "Line 1: foo()",
    "        ^^^^^",
    "Bad!"
    ].join("\n")

    let result = formatCompileError("foo()", {
      node: { loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } } },
      message: "Bad!"
    })

    assert.equal(expected, result);
  })
})

