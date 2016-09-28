#!/usr/bin/env node

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('compile', 'compile expression', function (yargs) {
      argv = yargs.option('l', {
        alias: 'language',
        description: 'language/adaptor'
      })
      .demand('language')

      .option('e', {
        alias: 'expression',
        description: 'target file to compile'
      })
      .demand('expression')

      .option('o', {
        alias: 'output',
        description: 'send output to a file'
      })

      .option('d', {
        alias: 'debug',
        description: 'debug'
      })

      .example('$0 compile -l salesforce -e foo.js', 'Using the salesforce language pack, compile foo.js to STDOUT')
      .example('$0 compile -l salesforce -e foo.js -o output.js', 'Using the salesforce language pack, compile foo.js to output.js')

      .help('help')
      .argv
    })
    .command('execute', 'run expression', function (yargs) {
      argv = yargs.option('l', {
        alias: 'language',
        description: 'resolvable language/adaptor path'
      })
      .demand('language')

      .option('e', {
        alias: 'expression',
        description: 'target expression to execute'
      })
      .demand('expression')

      .option('s', {
        alias: 'state',
        description: 'Path to initial state file.'
      })
      .demand('state')

      .option('o', {
        alias: 'output',
        description: 'Path to write output.'
      })

      .example('$0 execute -l salesforce -e foo.js -s state.json', 'Using the salesforce language pack, execute foo.js to STDOUT')

      .help('help')
      .argv
    })
    .demand(1, 'must provide a command')
    .help('h')
    .alias('h', 'help')
    .epilog('OpenFn 2016')
    .argv;

switch (argv._[0]) {
  case 'compile':

    try {

      const { modulePath, getModule, readFile, writeJSON, formatCompileError } = require('./utils');

      const Compile = require('./compile');
      const { verify, wrapRootExpressions, callFunction, wrapIIFE } = require('./compile/transforms');
      const Adaptor = getModule(modulePath(argv.language));

      const sandbox = Object.assign({
        console,
        Array,
        String,
        Date,
        Number,
        // need this to support an old job written by TNS.
        parseInt,
        JSON,
        Promise
      }, Adaptor);

      const transforms = [
        verify({ sandbox }),
        wrapRootExpressions('execute'),
        callFunction('execute','state'),
        // TODO: wrap in Promise IIFE, to ensure Executes interface is
        // always the same - conforming all errors.
        wrapIIFE()
      ]

      readFile(argv.expression).then((code) => {
        const compile = new Compile(code, transforms)

        if (compile.errors.length > 0) {
          compile.errors.map((error) => {
            return formatCompileError(code, error);
          }).map((error) => {
            console.log(error);
          })

          return Promise.reject(new Error("Compilation failed."))
        }

        return compile.toString();
      }).then((code) => {
        console.log(code);
      }).catch(e => {
        console.error(e.message);
        process.exitCode = 10;
      })

    } catch (e) {
      console.log(e);
      process.exitCode = 1;
    }

    break;

  case 'execute':

    const Execute = require('./execute');
    const { modulePath, getModule, readFile, writeJSON, formatCompileError } = require('./utils');

    const Compile = require('./compile');
    const { verify, wrapRootExpressions, callFunction, wrapIIFE } = require('./compile/transforms');

    try {
      // TODO: move this into the Promise chain and create exception handler.
      const Adaptor = getModule(modulePath(argv.language));

      // Make a sandbox used by both Execute and the `verify` transform.
      // Expressions will have access to `console`, `Promise` and the
      // adaptor functions (spread).
      const sandbox = Object.assign({
        console,
        Array,
        String,
        Date,
        Number,
        // need this to support an old job written by TNS.
        parseInt,
        JSON,
        Promise
      }, Adaptor);

      const transforms = [
        verify({ sandbox }),
        wrapRootExpressions('execute'),
        callFunction('execute','state'),
        // TODO: wrap in Promise IIFE, to ensure Executes interface is
        // always the same - conforming all errors.
        wrapIIFE()
      ]

      Promise.all([
        readFile(argv.state).then(JSON.parse),
        readFile(argv.expression).then((code) => {
          const compile = new Compile(code, transforms)

          if (compile.errors.length > 0) {
            compile.errors.map((error) => {
              return formatCompileError(code, error);
            }).map((error) => {
              console.log(error);
            })

            return Promise.reject(new Error("Compilation failed."))
          }

          return compile.toString();
        })
      ])

      .then(([state, expression]) => {
        // Break comment if you want to see the expression prior to execution.
        // console.log(expression);
        return Execute({ expression, state, sandbox })
          .then(state => {
            // TODO: stat path and check is writable before running expression
            if (argv.output) { return writeJSON(argv.output, state) }
            return state;
          })
          .then(state => {
            console.log("Finished.");
            process.exitCode = 0;
          })
          .catch(err => {
            process.exitCode = 1;
            console.log(1);
            return Promise.reject(err);
          })
      })
      .catch(err => {
        // Outer catch, for compilation.
        // TODO: check Error type and respond with appropriate error code
        console.error(err.message);
        process.exitCode = 1;
      })

    } catch (e) {
      console.error(e);
      process.exitCode = 10;
    }

    break;

}
