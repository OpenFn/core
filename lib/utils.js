const fs = require('fs');
const safeStringify = require('fast-safe-stringify');
const path = require('path');

function getPackageJson(path) {
  const packageJson = fs.readFileSync(path);
  return JSON.parse(packageJson);
}

function getModuleDetails(languagePack) {
  const lookupPath = languagePack + '/package.json';

  const resolvedPath =
    safeResolve(lookupPath) ||
    safeResolve(lookupPath, { paths: ['.', process.cwd()] });

  if (resolvedPath) {
    return getPackageJson(resolvedPath);
  }

  return null;
}

// require.resolve wrapped in an error handler, so that we can call successsively
// to locate the package.json for a language-pack
function safeResolve(request, options) {
  try {
    return require.resolve(request, options);
  } catch (error) {
    if (error.code == 'MODULE_NOT_FOUND') {
      return false;
    }

    throw error;
  }
}

// Generic Promise wrapper for fs.readFile.
async function readFile(path, options = 'utf8') {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

// Serialise and write object to JSON file.
async function readJSON(path, options = 'utf8') {
  return JSON.parse(await readFile(...arguments));
}

// Serialise and write object to JSON file.
async function writeJSON(path, obj, options = 'utf8') {
  return new Promise((resolve, reject) => {
    try {
      let data = safeStringify(obj, null, 2);
      fs.writeFile(path, data, options, err => {
        if (err) reject(err);
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

function formatCompileError(code, error) {
  if (error.node.loc) {
    let { start, end } = error.node.loc;
    let margin;
    return [
      (margin = `Line ${start.line}: `),
      code.split('\n')[start.line - 1] + '\n',
      Array(start.column + 1 + margin.length).join(' '),
      Array(Math.max(end.column - start.column + 1, 0)).join('^'),
      '\n' + error.message,
    ].join('');
  }
}

function interceptRequests() {
  console.log('Test mode enabled...');
  var Mitm = require('mitm');
  var mitm = Mitm();
  mitm.on('request', function (req, res) {
    console.log('Intercepted HTTP Request...');
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Headers: ${safeStringify(req.headers, null, 2)}`);
    var body = '';
    req.on('readable', function () {
      body += req.read();
    });
    req.on('end', function () {
      try {
        jsonBody = JSON.parse(body);
        console.log(safeStringify(jsonBody, null, 2));
      } catch (e) {
        console.log(body);
      }
      res.write(
        "What is real? How do you define 'real'? If you're talking about what\
        you can feel, what you can smell, what you can taste and see,\
        then 'real' is simply electrical signals interpreted by your brain."
      );
      res.end();
    });
  });
}

function warn() {
  console.log('🔒 console has been disabled for this run');
}

const disabledConsole = {
  debug() {
    return warn();
  },
  error() {
    return warn();
  },
  info() {
    return warn();
  },
  log() {
    return warn();
  },
  warn() {
    return warn();
  },
};

function addDebugLogs(languagePackage) {
  const corePackage = require('../package.json');
  const adaptorVersion = languagePackage
    ? `${languagePackage.name}@${languagePackage.version}`
    : `unknown`;
  const debug1 = `│ ◲ ◱  ${corePackage.name}#v${corePackage.version} (Node.js ${process.version}) │`;
  const debug2 =
    '│ ◳ ◰ ' +
    ' '.repeat(debug1.length - adaptorVersion.length - 9) +
    ` ${adaptorVersion} │`;

  console.log('╭' + '─'.repeat(debug1.length - 2) + '╮');
  console.log(debug1);
  console.log(debug2);
  console.log('╰' + '─'.repeat(debug1.length - 2) + '╯');
}

module.exports = {
  addDebugLogs,
  disabledConsole,
  formatCompileError,
  interceptRequests,
  getModuleDetails,
  getPackageJson,
  readFile,
  readJSON,
  safeResolve,
  writeJSON,
};
