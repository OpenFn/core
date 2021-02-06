const {
  Compile,
  transforms: { defaultTransforms, verify },
  sandbox: { buildSandbox, VMGlobals },
} = require('..');

const {
  modulePath,
  getModule,
  readFile,
  formatCompileError,
} = require('../utils');

function handler(argv) {
  try {
    const Adaptor = getModule(modulePath(argv.language));

    const sandbox = buildSandbox({
      noConsole: argv.noConsole,
      testMode: argv.test,
      extensions: [Adaptor],
    });

    readFile(argv.expression)
      .then(code => {
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
}
exports.command = 'compile';

exports.describe = 'compile an expression';

exports.builder = function (yargs) {
  return yargs
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

    .help('help');
};

exports.handler = handler;
