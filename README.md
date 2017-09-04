# fn-lang [![Build Status](https://travis-ci.org/OpenFn/fn-lang.svg?branch=master)](https://travis-ci.org/OpenFn/fn-lang)
A language toolkit for running OpenFn job expressions.

Getting Started
---------------
Clone [openfn-devTools](https://github.com/OpenFn/openfn-devtools) for a quick setup environment on your machine.  
Use cli.js execute (described below) to run jobs.

Execute
-------

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
