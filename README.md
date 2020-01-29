# OpenFn Core [![Build Status](https://travis-ci.org/OpenFn/core.svg?branch=master)](https://travis-ci.org/OpenFn/core)

Core is the central job processing program used in the OpenFn platform. It
creates an isolated Node VM, passes in `state` and an `expression`, then runs
the expression in this limited access Node VM.

## Getting Started

Clone [openfn-devTools](https://github.com/OpenFn/openfn-devtools) for a quick
setup environment on your machine. Use cli.js execute (described below) to run
jobs.

### Execute

`cli.js execute -l path/to/Adaptor -s ./tmp/state.json -e ./tmp/expression.js -o ./tmp/output.json`

Used to convert an expression into an executable script.

Options:

```
-l, --language    resolvable language/adaptor path                [required]
-e, --expression  target expression to execute                    [required]
-s, --state       Path to initial state file.                     [required]
-o, --output      Path to write result from expression
-t, --test        Intercepts and logs all HTTP requests to console
```

Examples:

Use a module in the parent folder, and pick out the `Adaptor` member.

```
cli.js execute -l ../language-http.Adaptor -e exp.js -s state.json
```

Use a npm installed module, and pick out the `Adaptor` member.

```
cli.js execute -l language-http.Adaptor -e exp.js -s state.json
```

## Debugging

Note that only certain parts of Node are whitelisted for use in Core.
These are the [globals exposed by VM2](https://github.com/patriksimek/vm2/blob/a63bef73e7239f9d14e48280b3c6f6763a5145d5/lib/main.js#L240-L265)
and the `extensions` we add for each run:

```js
const extensions = Object.assign(
  {
    console: argv.noConsole ? disabledConsole : console, // --nc or --noConsole
    testMode: argv.test, // --t or --test
    setTimeout, // We allow as Erlang will handle killing long-running VMs.
  },
  Adaptor
);
```

This means that you'll have access to whatever is exposed by the
language-package (aka `Adaptor`), `console` (unless blocked by a project
administrator for OpenFn Platform projects), and `setTimeout`. The `testMode`
property is used to intercept HTTP requests for offline testing.

## Writing language-packages

### Canonical sync "operation" or "helper function" for a language-pacakge

```js
export function sample(arg1, arg2) {
  return state => {
    state.output = arg1 + arg2;
    return state;
  };
}
```

### Canonical async "operation" or "helper function" for a language-pacakge

```js
export function sample(arg1, arg2) {
  return state => {
    return new Promise((resolve, reject) => {
      try {
        state.output = arg1 + arg2;
        resolve(state);
      } catch (error) {
        reject(error);
      }
    });
  };
}
```

## Internal notes on how execute works

```js
(function(state) {
  execute(
    alterState(() => {}),
    alterState((state) => {}), // function(state) { }
    alterState(() => {})
  )(state);
})(state)

[
  (alterState(() => {}), alterState(() => {}), alterState(() => {}))
].reduce((acc, v) => {
  return v(state).then(acc)
}, new Promise);


f(state).then((state) => return state).then()
```
