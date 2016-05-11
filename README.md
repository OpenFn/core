FnLang
======

Language toolkit for OpenFn.

Features
--------

* Dynamically evaluate an expression with a given language adaptor
* Wrap an expression in an executable script
* Validate an expression against the specific language/version **COMING SOON**
* Execute an expression in-browser for testing **COMING SOON**

Examples
--------

### Execute an expression

`fn-lang compile -l salesforce -e expression.js -d data.json -c configuration.json`  
Returns the output to `STDOUT`, allowing you check for failure/success.

### Wrap an expression in a script

`fn-lang compile -l language-salesforce.default -f expression.js`  

Returns a wrapped expression to `STDOUT`, allowing you check the output.

```
fn-lang compile -l salesforce -f expression.js -o myExpression.js
cat state.json | node myExpression.js
```

