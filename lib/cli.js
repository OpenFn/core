#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('compile', 'compile expression', function (yargs) {
    argv = yargs
      .option('l', {
        alias: 'language',
        description: 'language/adaptor',
      })
      .demand('language')

      .option('e', {
        alias: 'expression',
        description: 'target file to compile',
      })
      .demand('expression')

      .option('o', {
        alias: 'output',
        description: 'send output to a file',
      })

      .option('d', {
        alias: 'debug',
        description: 'debug',
      })

      .example(
        '$0 compile -l salesforce -e foo.js',
        'Using the salesforce language pack, compile foo.js to STDOUT'
      )
      .example(
        '$0 compile -l salesforce -e foo.js -o output.js',
        'Using the salesforce language pack, compile foo.js to output.js'
      )

      .help('help').argv;
  })
  .command('execute', 'run expression', function (yargs) {
    argv = yargs
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

      .help('help').argv;
  })
  .demand(1, 'must provide a command')
  .help('h')
  .alias('h', 'help')
  .epilog('OpenFn 2016').argv;

const Compile = require('./compile');
const Execute = require('./execute');

const {
  verify,
  wrapRootExpressions,
  callFunction,
  wrapIIFE,
} = require('./compile/transforms');

const {
  modulePath,
  getModule,
  readFile,
  writeJSON,
  formatCompileError,
  interceptRequests,
  disabledConsole,
} = require('./utils');

const { VM } = require('vm2');
const globals = new VM({}).run(
  `Object.getOwnPropertyNames(this).reduce((obj, item) => {
    obj[item] = this[item];
    return obj;
  }, {});`
);

// TODO: move this into the Promise chain and create exception handler.
const Adaptor = getModule(modulePath(argv.language));

// Assign extensions which will be added to VM2's sandbox, used by both Execute
// and the `verify` transform in Compile.
const extensions = Object.assign(
  {
    console: argv.noConsole ? disabledConsole : console, // --nc or --noConsole
    testMode: argv.test, // --t or --test
    setTimeout, // We allow as Erlang will handle killing long-running VMs.
  },
  Adaptor
);

switch (argv._[0]) {
  case 'compile':
    try {
      const transforms = [
        verify({ sandbox: Object.assign(globals, extensions) }),
        wrapRootExpressions('execute'),
        callFunction('execute', 'state'),
        // TODO: wrap in Promise IIFE, to ensure Executes interface is
        // always the same - conforming all errors.
        wrapIIFE(),
      ];

      readFile(argv.expression)
        .then(code => {
          const compile = new Compile(code, transforms);

          if (compile.errors.length > 0) {
            compile.errors
              .map(error => {
                return formatCompileError(code, error);
              })
              .map(error => {
                console.log(error);
              });

            return Promise.reject(new Error('Compilation failed.'));
          }

          return compile.toString();
        })
        .then(code => {
          console.log(code);
        })
        .catch(e => {
          console.error(e.message);
          process.exitCode = 10;
        });
    } catch (e) {
      console.log(e);
      process.exitCode = 1;
    }

    break;

  case 'execute':
    const adaptorVersion = argv.language.substring(
      argv.language.lastIndexOf('/') + 1
    );

    const debug = `│ ◰ ◱ ◲ ◳  OpenFn/core ~ ${adaptorVersion} (Node ${process.version}) │`;
    console.log('╭' + '─'.repeat(debug.length - 2) + '╮');
    console.log(debug);
    console.log('╰' + '─'.repeat(debug.length - 2) + '╯');

    try {
      if (argv.test) {
        interceptRequests();
      }

      const transforms = [
        verify({ sandbox: Object.assign(globals, extensions) }),
        wrapRootExpressions('execute'),
        callFunction('execute', 'state'),
        // TODO: wrap in Promise IIFE, to ensure Executes interface is
        // always the same - conforming all errors.
        wrapIIFE(),
      ];

      Promise.all([
        readFile(argv.state).then(JSON.parse),
        readFile(argv.expression).then(code => {
          const compile = new Compile(code, transforms);

          if (compile.errors.length > 0) {
            compile.errors
              .map(error => {
                return formatCompileError(code, error);
              })
              .map(error => {
                console.log(error);
              });

            return Promise.reject(new Error('Compilation failed.'));
          }

          return compile.toString();
        }),
      ])

        .then(([state, expression]) => {
          // Break comment if you want to see the expression prior to execution.
          // console.log(expression);
          return Execute({ expression, state, extensions })
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

    break;
}
