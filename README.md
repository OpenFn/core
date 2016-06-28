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

`diesl compile -l salesforce -e expression.js -d data.json -c configuration.json`  
Returns the output to `STDOUT`, allowing you check for failure/success.

### Wrap an expression in a script

`diesl compile -l language-salesforce.default -d doclet.json -f expression.js`  

Returns a wrapped expression to `STDOUT`, allowing you check the output.

```
diesl compile -l salesforce -f expression.js -o myExpression.js
cat state.json | node myExpression.js
```

Compile
-------

`diesl compile`  

Used to convert an expression into an executable script.

Options:
```
-l, --language  language/adaptor                                    [required]
-d, --doclet    path to JSDoc output for language pack (JSON)       [required]
-f, --file      target file to compile                              [required]
-o, --output    send output to a file
```

The current compiler outputs a script that takes initial state via `STDIN`.
E.g. `echo '{}' | node script.js`  

It also can accept a `STATE_PATH` environment variable which writes the final
state to disk on success.  
E.g. `echo '{}' | STATE_PATH=/tmp/final_state.json node script.js`  


TODO
----

- [ ] Validate an expression against the specific language/version
- [ ] Execute an expression in-browser for testing
