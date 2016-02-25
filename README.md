Diesl, formerly `FnLang`
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

**DEPRECATED**

`fn-lang compile -l salesforce -f expression.js`  

Returns a wrapped expression to `STDOUT`, allowing you check the output.

```
fn-lang compile -l salesforce -f expression.js > myExpression.js
node myExpression.js --configuration config.json --data data.json
```

Wrappers
--------

**DEPRECATED**

### Shell

The standard `compile` command returns a shell wrapper for the expression.

Check out the [template](templates/body.hbs.js) over here.

There are four parts to the template:

1. Parsing the CLI arguments
2. Loading the specified adaptor
3. Injecting the language pack's expressions
4. The expression itself, wrapped in an `execute` call.

If you're not sure about what the script expects, you can run the script
with `-h` for more information.



