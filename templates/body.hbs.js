var argv = require('yargs')
  .usage('Usage: $0 [options]')
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

  .example('$0 -c configuration.json -d data.json',
          'Execute this compiled expression using the data and credentials provided.')
  .help('h')
  .alias('h', 'help')
  .epilog('OpenFn 2015')
  .argv;


console.log("Running expression using: {{moduleName}}/{{adaptorName}}");
var Adaptor = require("{{moduleName}}")["{{adaptorName}}"];

var configuration = require(argv.configuration);
var data = require(argv.data);

{{#each expressions}}
var {{{ this }}} = Adaptor.{{{ this }}};
{{/each}}

var state = {
  configuration: configuration,
  data: data
}

execute(
  state,
  {{{ source }}}
);


