const {
  Compile,
  Execute,
  transforms: { defaultTransforms, verify },
  sandbox: { buildSandbox, VMGlobals },
} = require('..');

const {
  modulePath,
  getModule,
  readFile,
  writeJSON,
  formatCompileError,
  interceptRequests,
  getModuleVersion,
  addDebugLogs,
} = require('../utils');

function handler(argv) {
  const adaptorVersion = getModuleVersion(argv.language);

  addDebugLogs(adaptorVersion);
  console.log('Starting up @', new Date());

  try {
    if (argv.test) {
      interceptRequests();
    }

    const Adaptor = getModule(modulePath(argv.language));

    const sandbox = buildSandbox({
      noConsole: argv.noConsole,
      testMode: argv.test,
      extensions: [Adaptor],
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
      })
      .finally(() => {
        console.log('Memory usage:');
        const used = process.memoryUsage();
        for (let key in used) {
          console.log(
            ` - ${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
          );
        }
        console.log('Shutting down @', new Date());
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
