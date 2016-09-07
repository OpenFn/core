const assert = require('assert');
const { modulePath, writeJSON, readFile } = require('../lib/utils');

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

  })

  it(".writeJSON", () => {
    return writeJSON('/tmp/output.json', {a: 1})
      .then(() => readFile('/tmp/output.json'))
      .then((str) => assert.deepEqual({a: 1}, JSON.parse(str)))
  })
})

