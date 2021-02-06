#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

yargs(hideBin(process.argv))
  .command(require('./compile-command'))
  .command(require('./execute-command'))
  .demandCommand(1, 'must provide a command')
  .help('h')
  .alias('h', 'help')
  .epilog('OpenFn 2021').argv;
