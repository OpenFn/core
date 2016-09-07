const fs = require('fs');

function modulePath(str) {
  const path = str.match(/^([\.\/]*[\w\-]+[\/\w-+]+)/)[1];
  let memberName = str.match(/(\.\w+)$/)

  if (memberName) memberName = memberName[1].replace('.','')

  const isRelative = /^[\.\/]/.test(path);

  return { path, memberName, isRelative }
}

// Given a parsed module path, require the module either relatively or
// directly (normal nodejs lookup) and return the member if necessary.
function getModule({ path, memberName, isRelative }) {
  let module;

  if (isRelative) {
    module = require(process.cwd() + '/' + path);
  } else {
    module = require(path);
  }

  // Module path is `module-name.member`.
  if (memberName) {
    return module[memberName];
  }

  return module;
}

// Generic Promise wrapper for fs.readFile.
function readFile(path, options='utf8') {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (err,data) => {
      if (err) reject(err);
      resolve(data);
    })
  });
}

// Serialise and write object to JSON file.
function writeJSON(path, obj, options='utf8') {
  return new Promise((resolve, reject) => {
    try {
      let data = JSON.stringify(obj, null, 2);
      fs.writeFile(path, data, options, (err) => {
        if (err) reject(err);
        resolve();
      })
    } catch (e) {
      reject(e);
    }
  });
}


module.exports = { modulePath, getModule, readFile, writeJSON };
