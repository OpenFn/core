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
  
}
