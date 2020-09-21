const {
    verify,
    wrapRootExpressions,
    callFunction,
    wrapIIFE,
} = require('./compile/transforms');
const {
    modulePath,
    getModule,
    writeJSON,
    formatCompileError
} = require('./utils');

const {buildReturnObject} = require('../../src/routes/utils')
const Compile = require('./compile');
const Execute = require('./execute');
const util = require('util')
const { VM } = require('vm2');

const globals = new VM({}).run(
    `Object.getOwnPropertyNames(this).reduce((obj, item) => {
    obj[item] = this[item];
    return obj;
  }, {});`
);

function Execute_noCLI(state, expression, language, res){
    const f = require('fs');
    let adaptVersion;
    const lan_path = `./languages/${language}.Adaptor`
    const Adaptor = getModule(modulePath(lan_path));
    const http_Adaptor = require('language-http/lib/Adaptor')

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

            return new Error('Compilation failed.')
        }
        code = compile.toString()

        // Break comment if you want to see the expression prior to execution.
        console.log(code)

        if (!code) {
            throw new Error('Cannot execute without an expression.');
        }
        if (!state) {
            throw new Error('Cannot execute without an initial state.');
        }

        return new VM({
            sandbox: Object.assign({ state }, extensions),
        }).run(code)
            .then(state => {
                return state;
            }).catch(err => {
                process.exitCode = 1;
                return Promise.reject(err);
            })
            .then(state => {
                console.log("------")
                console.log('Finished.');
                process.exitCode = 0;
                if (state.references) {
                    const returnObject = buildReturnObject(
                        state.references[0].body.httpStatus,
                        state.references[0].body.httpStatusCode,
                        state.references[0].body.message
                    )
                    return res.send(returnObject)
                }else {
                    const returnObject = buildReturnObject(
                    state.body.httpStatus,
                    state.body.httpStatusCode,
                    state.body.message
                )
                return res.status(state.body.httpStatusCode).send(returnObject)
                }
            })
            .catch(err => {
                process.exitCode = 1;
                Promise.reject(err);
                if (err.response) {
                    const returnObject = buildReturnObject(
                        err.response.body.httpStatus,
                        err.response.body.httpStatusCode,
                        err.response.body.message + ' \\n ' + JSON.stringify(err.response.body.response.importSummaries)
                    )
                    return res.status(err.response.body.httpStatusCode).send(returnObject)
                }else {
                    console.log("else statelent")
                    error_obj = JSON.parse(err.message.split('responded with:',2)[1])
                    console.log(error_obj)
                    console.log("***********")

                    const returnObject = buildReturnObject(
                        error_obj.body.httpStatus,
                        error_obj.body.httpStatusCode,
                        error_obj.body.message + ' \\n ' + JSON.stringify(error_obj.body.response.importSummaries)
                    )
                    return res.status(error_obj.body.httpStatusCode).send(returnObject)
                }
            })
    } catch (e) {
        console.log("-------------")
        console.error(e);
        process.exitCode = 10;
    }
}

module.exports = Execute_noCLI;
