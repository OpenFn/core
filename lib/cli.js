#!/usr/bin/env node

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('compile', 'compile expression', function (yargs) {
      argv = yargs.option('l', {
        alias: 'language',
        description: 'language/adaptor'
      })
      .demand('language')

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
        description: 'language/adaptor'
      })
      .demand('language')

      .option('e', {
        alias: 'expression',
        description: 'target expression to execute'
      })
      .demand('expression')

      .option('c', {
        alias: 'configuration',
        description: 'Path to configuration file.'
      })
      .demand('configuration')

      .option('d', {
        alias: 'data',
        description: 'Path to data file.'
      })
      .demand('data')

      .example('$0 execute -l salesforce -e foo.js -c configuration.json -d data.json', 'Using the salesforce language pack, execute foo.js to STDOUT')
      
      .help('help')
      .argv
    })
    .demand(1, 'must provide a command')
    .help('h')
    .alias('h', 'help')
    .epilog('OpenFn 2015')
    .argv;

switch (argv._[0]) {
  case 'compile':

    var Compile = require('./compile');
    var fs = require('fs');
    
    var result = Compile({languageName: argv.language, file: argv.file})
    if (argv.output === undefined) {
      process.stdout.write(result)
    } else {
      fs.writeFileSync(argv.output, result)  
    }
    process.exit(0);
    
    break;

  case 'execute':

    var Execute = require('./execute');
    
    Execute(argv)
    
    break;
  
}
