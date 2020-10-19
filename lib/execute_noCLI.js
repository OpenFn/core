const {
    verify,
    wrapRootExpressions,
    callFunction,
    wrapIIFE,
} = require('./compile/transforms');
const {
    modulePath,
    getModule,
    formatCompileError
} = require('./utils');

function moduleAvailable(name) {
    try {
        require.resolve(name);
        return true;
    } catch(e){}
    return false;
}

const Compile = require('./compile');
const { VM } = require('vm2');

const globals = new VM({}).run(
    `Object.getOwnPropertyNames(this).reduce((obj, item) => {
    obj[item] = this[item];
    return obj;
  }, {});`
);

function Execute_noCLI(expression, state, ext , lan_path){
    function execute() {
        for (var _len = arguments.length, operations = Array(_len), _key = 0; _key < _len; _key++) {
            operations[_key] = arguments[_key];
        }

        return function (state) {
            var start = Promise.resolve(state);

            return operations.reduce(function (acc, operation) {
                return acc.then(operation);
            }, start);
        };
    }
    if (!expression) {
        throw new Error('Cannot execute without an expression.');
    }
    if (!state) {
        throw new Error('Cannot execute without an initial state.');
    }
    const f = require('fs');
    let adaptVersion;
    Adaptor = null;
    if (lan_path){
        Adaptor = getModule(modulePath(lan_path));
    }
    http_Adaptor = null;
    if (moduleAvailable('language-common')) {
        http_Adaptor = require('language-common/lib/index');
    }

    const extensions = Object.assign(
        {
            setTimeout // We allow as Erlang will handle killing long-running VMs.
        },
        http_Adaptor,
        Adaptor,
        ext
    );
    try {
        // Assign extensions which will be added to VM2's sandbox, used by both Execute
        // and the `verify` transform in Compile.
        const rawdata = f.readFileSync(
            lan_path.substring(0, lan_path.lastIndexOf('Adaptor') - 1) + '/package.json'
        );
        const package = JSON.parse(rawdata);
        adaptorVersion = `${package.name}#v${package.version}`;
    } catch (error) {
        adaptorVersion = lan_path;
    }

    const debug_prep = `│ ◰ ◱ ◲ ◳  OpenFn/core ~ ${adaptVersion} (Node ${process.version}) │`;
    console.log('╭' + '─'.repeat(debug_prep.length - 2) + '╮');
    console.log(debug_prep);
    console.log('╰' + '─'.repeat(debug_prep.length - 2) + '╯');

    try {

        const transforms = [
            verify({ sandbox: Object.assign(globals, extensions) }),
            wrapRootExpressions('execute'),
            callFunction('execute', 'state'),
            // TODO: wrap in Promise IIFE, to ensure Executes interface is
            // always the same - conforming all errors.
            wrapIIFE(),
        ];
        const compile = new Compile(expression, transforms);
        if (compile.errors.length > 0) {
            compile.errors
                .map(error => {
                    return formatCompileError(expression, error); // TODO return response with error
                })
                .map(error => {
                    console.log(error);
                });

            return new Error('Compilation failed.');
        }
        code = compile.toString();

        // Break comment if you want to see the expression prior to execution.
        //console.log(code);
        return new VM({
            sandbox: Object.assign({state} , extensions)
        }).run(code);
    } catch (e) {
        console.log(e);
    }
}

module.exports = Execute_noCLI;
