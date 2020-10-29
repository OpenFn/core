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
const execute = require('./execute')
const { VM } = require('vm2');

const globals = new VM({}).run(
    `Object.getOwnPropertyNames(this).reduce((obj, item) => {
    obj[item] = this[item];
    return obj;
  }, {});`
);

function Execute_noCLI(expression, state, ext , lan_path){
    if (!expression) {
        throw new Error('Cannot execute without an expression.');
    }
    if (!state) {
        throw new Error('Cannot execute without an initial state.');
    }
    const f = require('fs');
    let adaptVersion;
    Adaptor = null
    if (lan_path){
        Adaptor = getModule(modulePath(lan_path))
    }
    http_Adaptor = null;
    if (moduleAvailable('language-http')) {
        http_Adaptor = require('language-http/lib/Adaptor');
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
        var code = compile.toString();
        return Execute(code,state,extensions)

    } catch (e) {
        console.log(e);
    }
}

function Execute(code, state, ext){
    // Break comment if you want to see the expression prior to execution.
    if (!code) {
        throw new Error('Cannot execute without an expression.');
    }
    if (!state) {
        throw new Error('Cannot execute without an initial state.');
    }
    return new VM({
        sandbox: Object.assign({state} , ext)
    }).run(code)
}


module.exports = {
    Execute,
    Execute_noCLI
}
