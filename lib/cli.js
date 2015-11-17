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

      .example('$0 compile -l salesforce -f foo.js', 'Using the salesforce language pack, compile foo.js')
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

    Compile({languageName: argv.language, file: argv.file})
    process.exit(0);
    
    break;
  
}
