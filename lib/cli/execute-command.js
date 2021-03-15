const {
  Compile,
  Execute,
  transforms: { defaultTransforms, verify },
  sandbox: { buildSandbox, VMGlobals },
} = require('..');

const {
  safeResolve,
  readFile,
  writeJSON,
  formatCompileError,
  interceptRequests,
  getModuleDetails,
  addDebugLogs,
} = require('../utils');

function handler(argv) {
  try {
    if (argv.test) {
      interceptRequests();
    }

    const moduleDetails = getModuleDetails(argv.language) || {
      version: 'unknown',
    };

    addDebugLogs(moduleDetails);

    // We try and resolve the location of the module entry point by first trying
    // with the default lookups/NODE_PATH env var, then fall back to looking in
    // local directory.
    // This is to allow loading language packs from both a node_modules folder
    // or relative paths. Working around that a relative path is considered
    // from _this_ file - and not from the cwd where the path was given.
    const adaptorPath =
      safeResolve(argv.language) ||
      safeResolve(argv.language, { paths: ['.'] });

    if (!adaptorPath) {
      throw new Error(`Cannot find module '${argv.language}'.`);
    }

    const adaptor = require(adaptorPath);

    const sandbox = buildSandbox({
      noConsole: argv.noConsole,
      testMode: argv.test,
      extensions: [adaptor.Adaptor || adaptor],
    });

    Promise.all([
      readFile(argv.state).then(JSON.parse),
      readFile(argv.expression).then(code => {
        const compile = new Compile(code, [
          ...defaultTransforms,
          verify({ sandbox: { ...sandbox, ...VMGlobals } }),
        ]);

        if (compile.errors.length > 0) {
          console.error(
            compile.errors.map(err => formatCompileError(code, err)).join('\n')
          );

          return Promise.reject(new Error('Compilation failed.'));
        }

        return compile.toString();
      }),
    ])
      .then(([state, expression]) => {
        // Break comment if you want to see the expression prior to execution.
        // console.log(expression);
        return Execute({ expression, state, sandbox })
          .then(state => {
            // TODO: stat path and check is writable before running expression
            if (argv.output) {
              return writeJSON(argv.output, state);
            }
            return state;
          })
          .then(state => {
            console.log('Finished.');
            process.exitCode = 0;
          })
          .catch(err => {
            process.exitCode = 1;
            return Promise.reject(err);
          });
      })
      .catch(err => {
        // Outer catch, for compilation.
        // TODO: check Error type and respond with appropriate error code
        console.error(err);
        process.exitCode = 1;
      });
  } catch (e) {
    console.error(e);
    process.exitCode = 10;
  }
}

exports.command = 'execute';

exports.describe = 'run an expression';

exports.builder = function (yargs) {
  return yargs
    .option('l', {
      alias: 'language',
      description: 'resolvable language/adaptor path',
    })
    .demand('language')

    .option('e', {
      alias: 'expression',
      description: 'target expression to execute',
    })
    .demand('expression')

    .option('s', {
      alias: 'state',
      description: 'Path to initial state file.',
    })
    .demand('state')

    .option('o', {
      alias: 'output',
      description: 'Path to write output.',
    })

    .option('t', {
      alias: 'test',
      description: 'test mode, no HTTP requests',
    })

    .option('nc', {
      alias: 'noConsole',
      description: 'if set to true, removes console.log for security',
    })

    .example(
      '$0 execute -l salesforce -e foo.js -s state.json',
      'Using the salesforce language pack, execute foo.js to STDOUT'
    )

    .help('help');
};

exports.handler = handler;
