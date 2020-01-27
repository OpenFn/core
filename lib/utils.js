const fs = require('fs');

function modulePath(str) {
  try {
    let [__, path, moduleName, version, memberName] = str.match(
      /^([.]{0,2}[\/\w-]*\/)*([\w\-]+)(-v?[\d\.]*)?(?:\.)?(\w+)?$/
    );

    isRelative = !!(path && path.match(/\./));
    version = version || '';
    path = (path || '') + moduleName + version.replace(/.$/, '');
    memberName = memberName || null;

    return { path, memberName, isRelative };
  } catch (e) {
    console.log(e);
    throw new Error("Can't resolve module details");
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
function readFile(path, options = 'utf8') {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

// Serialise and write object to JSON file.
function writeJSON(path, obj, options = 'utf8') {
  return new Promise((resolve, reject) => {
    try {
      let data = JSON.stringify(obj, null, 2);
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
  let { start, end } = error.node.loc;
  let margin;

  return [
    (margin = `Line ${start.line}: `),
    code.split('\n')[start.line - 1] + '\n',
    Array(start.column + 1 + margin.length).join(' '),
    Array(end.column - start.column + 1).join('^'),
    '\n' + error.message,
  ].join('');
}

function interceptRequests() {
  console.log('Test mode enabled...');
  var Mitm = require('mitm');
  var mitm = Mitm();
  mitm.on('request', function(req, res) {
    console.log('Intercepted HTTP Request...');
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    var body = '';
    req.on('readable', function() {
      body += req.read();
    });
    req.on('end', function() {
      try {
        jsonBody = JSON.parse(body);
        console.log(JSON.stringify(jsonBody, null, 2));
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
  console.log('console has been disabled.');
}

function makeSandbox(adaptor, argv) {
  const disabledConsole = {
    info() {
      return warn();
    },
    log() {
      return warn();
    },
    warn() {
      return warn();
    },
    error() {
      return warn();
    },
  };
  return Object.assign(
    {
      console: argv.noConsole ? disabledConsole : console,
      JSON,
      Math,
      parseInt,
      setTimeout,
      testMode: argv.test,
    },
    adaptor
  );
}

module.exports = {
  modulePath,
  getModule,
  readFile,
  writeJSON,
  interceptRequests,
  formatCompileError,
  makeSandbox,
};
