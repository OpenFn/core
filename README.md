Diesl
=====

Language toolkit for OpenFn.

Features
--------

* Dynamically evaluate an expression with a given language adaptor
* Wrap an expression in an executable script

Examples
--------

### Execute an expression

`diesl compile -l language-salesforce.Adaptor -e expression.js -s data.json`  
Returns the output to `STDOUT`, allowing you check for failure/success.

### Wrap an expression in a script

`diesl compile -l language-salesforce.default -d doclet.json -f expression.js`  

Returns a wrapped expression to `STDOUT`, allowing you check the output.

```
diesl compile -l salesforce -f expression.js -o myExpression.js
cat state.json | node myExpression.js
```

Execute
-------

`diesl execute`  

Used to convert an expression into an executable script.

Options:
```
-l, --language    resolvable language/adaptor path                [required]
-e, --expression  target expression to execute                    [required]
-s, --state       Path to initial state file.                     [required]
-o, --output      Path to write result from expression **TODO**
```

Examples:

Use a module in the parent folder, and pick out the `Adaptor` member.
```
diesl execute -l ../language-http.Adaptor -e exp.js -s state.json
```

Use a npm installed module, and pick out the `Adaptor` member.
```
diesl execute -l language-http.Adaptor -e exp.js -s state.json
```

Compile
-------

Currently deprecated in this release.
Execute now does compilation and execution, by unifying these behaviours
`compile` will be reimplemented to offer deeper debugging tools.
