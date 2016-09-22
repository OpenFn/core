const fs = require('fs');

function modulePath(str) {
  try {
    let [ __, path, moduleName, version, memberName ] = 
      str.match(/^([.]{0,2}[\/\w-]*\/)*([\w\-]+)(-v?[\d\.]*)?(?:\.)?(\w+)?$/)

    isRelative = !!( path && path.match(/\./) )
    version = version || ""
    path = (path || "") + moduleName + version.replace(/.$/, "")
    memberName = memberName || null

    return { path, memberName, isRelative }
  } catch (e) {
    console.log(e);
    throw new Error("Can't resolve module details")
  }
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

function formatCompileError(code, error) {

  let { start, end } = error.node.loc;
  let margin;

  return [
    margin = `Line ${start.line}: `,
    code.split("\n")[start.line - 1] + "\n",
    Array(start.column + 1 + margin.length).join(" "),
    Array(end.column - start.column + 1).join("^"),
    "\n" + error.message
  ].join('')
  
}


module.exports = { modulePath, getModule, readFile, writeJSON, formatCompileError };
