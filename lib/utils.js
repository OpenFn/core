const fs = require('fs');

function modulePath(str) {
  const path = str.match(/^([\.\/]*[\w\-]+[\/\w-+]+)/)[1];
  let memberName = str.match(/(\.\w+)$/)

  if (memberName) memberName = memberName[1].replace('.','')

  const isRelative = /^[\.\/]/.test(path);

  return { path, memberName, isRelative }
}

function getModule({ path, memberName, isRelative }) {
  if (isRelative) {
    return require(process.cwd() + '/' + path);
  } else {
    return require(path);
  }
}

// Generic Promise wrapper for fs.readFile.
function readFile(path, options) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (err,data) => {
      if (err) reject(err);
      resolve(data);
    })
  });
}


module.exports = { modulePath, getModule, readFile };
