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

const Compile = require('./compile');
const { VM } = require('vm2');

const globals = new VM({}).run(
    `Object.getOwnPropertyNames(this).reduce((obj, item) => {
    obj[item] = this[item];
    return obj;
  }, {});`
);

function Execute_noCLI(expression, state, lan_path){
    if (!expression) {
        throw new Error('Cannot execute without an expression.');
    }
    if (!state) {
        throw new Error('Cannot execute without an initial state.');
    }
    const f = require('fs');
    let adaptVersion;
    const Adaptor = getModule(modulePath(lan_path));
    const http_Adaptor = require('language-http/lib/Adaptor');

    const extensions = Object.assign(
        {
            setTimeout // We allow as Erlang will handle killing long-running VMs.
        },
        Adaptor,
        http_Adaptor
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
        console.log(code);

        return new VM({
            sandbox: Object.assign({ state }, extensions),
        }).run(code)
            .then(state => {
                return state;
            }).catch(err => {
                console.log(err)
                return Promise.reject(err);
            })
            .then(state => {
                console.log("---------");
                console.log('Finished.');
                if (state.references) {
                    return {
                        "httpStatus" : state.references[0].body.httpStatus,
                        "httpStatusCode" : state.references[0].body.httpStatusCode,
                        "message" : state.references[0].body.message
                    };
                }else if (state.body){
                    return {
                        "httpStatus" : state.body.httpStatus,
                        "httpStatusCode" : state.body.httpStatusCode,
                        "message" : state.body.message
                    };
                }
                else {
                    return state
                }
            })
            .catch(err => {
                if (err.response) {
                    return returnObject = {
                        "httpStatus" : err.response.body.httpStatus,
                        "httpStatusCode" : err.response.body.httpStatusCode,
                        "message" : err.response.body.message + ' \\n ' + JSON.stringify(err.response.body.response.importSummaries)
                    };
                }else {
                    error_obj = JSON.parse(err.message.split('responded with:',2)[1]);
                    return returnObject = {
                        "httpStatus" : error_obj.body.httpStatus,
                        "httpStatusCode" : error_obj.body.httpStatusCode,
                        "message" : error_obj.body.message + " " + JSON.stringify(error_obj.body.response.conflicts)
                    }
                }
            });
    } catch (e) {
        console.log(e);
    }
}

module.exports = Execute_noCLI;