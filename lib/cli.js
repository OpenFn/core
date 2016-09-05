#!/usr/bin/env node

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('compile', 'compile expression', function (yargs) {
      argv = yargs.option('l', {
        alias: 'language',
        description: 'language/adaptor'
      })
      .demand('language')

      argv = yargs.option('d', {
        alias: 'doclet',
        description: 'path to JSDoc output for language pack (JSON)'
      })
      .demand('doclet')

      .option('f', {
        alias: 'file',
        description: 'target file to compile'
      })
      .demand('file')

      .option('o', {
        alias: 'output',
        description: 'send output to a file'
      })

      .example('$0 compile -l salesforce -f foo.js', 'Using the salesforce language pack, compile foo.js to STDOUT')
      .example('$0 compile -l salesforce -f foo.js -o output.js', 'Using the salesforce language pack, compile foo.js to output.js')
      
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

    var compiler = require('./compile');
    var fs = require('fs');

    var code = fs.readFileSync(argv.file, 'utf8')
    if (argv.doclet)
      var doclets = JSON.parse(fs.readFileSync(argv.doclet, 'utf8'))

    try {
      var docletPath = argv.doclet;
      var ast = compiler.transform(code, {languagePack: argv.language, doclets: doclets})
      var result = compiler.toString(ast)

      if (argv.output === undefined) {
        process.stdout.write(result)
      } else {
        fs.writeFileSync(argv.output, result)  
      }
      
    } catch (e) {
      console.log(e);
      process.exitCode = 1;
    }
    
    break;

  case 'execute':

    const Execute = require('./execute');
    const { modulePath, getModule, readFile } = require('./utils');
    const { path, memberName, isRelative } = modulePath(argv.language)

    try {
      const Adaptor = getModule(modulePath(argv.language));
      
      Promise.all([
        readFile(argv.state).then(JSON.parse),
        readFile(argv.expression)
      ])
      .then(([state, expression]) => {
        return Execute({ expression, state, sandbox: Adaptor })
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
            console.log(2);
        console.error(err);
        process.exitCode = 1;
      })

    } catch (e) {
      console.err(e);
      process.exitCode = 10;
    }
    
    break;
  
}
