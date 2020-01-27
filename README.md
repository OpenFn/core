# OpenFn Core [![Build Status](https://travis-ci.org/OpenFn/core.svg?branch=master)](https://travis-ci.org/OpenFn/core)

Core is the central job processing program used in the OpenFn platform. It
creates an isolated Node VM, passes in `state` and an `expression`, then runs
the expression in this limited access Node VM.

## Getting Started

Clone [openfn-devTools](https://github.com/OpenFn/openfn-devtools) for a quick setup environment on your machine.  
Use cli.js execute (described below) to run jobs.

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
and those added by the `makeSandbox` utility function. They are:

- Array
- Boolean
- Buffer
- console
- Date
- Error
- EvalError
- Function
- JSON
- Map
- Number
- Object
- parseInt
- Promise
- Proxy
- RangeError
- ReferenceError
- Reflect
- RegExp
- Set
- setTimeout
- String
- Symbol
- SyntaxError
- TypeError
- URIError
- VMError
- WeakMap
- WeakSet

## Notes on execute

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
