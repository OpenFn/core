const recast = require('recast'),
  estemplate = require('estemplate'),
  fs = require('fs');

const types = require("ast-types");
const { namedTypes: n, builders: b } = types;
const util = require('util');

function toString(ast) {
  return recast.print(ast).code;
}

function transform(ast, { languagePack }) {

  let moduleConfig = {
    path: languagePack.split(".")[0],
    memberProperty: languagePack.split(".")[1]
  }

  try {
    // Check if the language pack specified exists
    // TODO: referencing call expressions not available in the languagePack
    // should register errors on the AST.
    require.resolve(moduleConfig.path)
  } catch (e) {
    console.warn(`Warning: ${languagePack} could not be resolved.`)
  }

  if (typeof ast === 'string')
    ast = recast.parse(ast)

  ast.callExpressions = [];

  console.log("Analysing expression");
  // get static analysis of expression

  types.visit(ast, {
    // This method will be called for any node with .type "CallExpression":
    visitCallExpression: function(path) {
      var node = path.node;

      // If a callExpression's callee is also a callExpression
      // then we can assume state is being injected.
      // i.e. operation(...args)(state)
      if ( !n.CallExpression.check(node.callee) )
        // We only track callees with identity.
        // So skip over over outer callExpressions.
        ast.callExpressions.push(node);


      this.traverse(path);
    }
  });


  // Unique Expressions
  let languageCallExpressions = ast.callExpressions.map(c => c.callee.name)
    .filter(( value,index,self ) => self.indexOf(value) === index)


  console.info(`Found ${ast.callExpressions.length} call expressions.`);
  console.info(`This expression uses the following calls:\n  ${languageCallExpressions.join(', ')}`)

  // =======================================================================
  // Execute Wrapper
  // =======================================================================

  ast.rootExpressions = []

  types.visit(ast, {
    visitCallExpression: function(path) {
      var node = path.node;

      ast.rootExpressions.push(node);

      return false;
    }
  });

  console.info(`Found ${ast.rootExpressions.length} root call expressions.`);
  console.info("Wrapping root call expressions in `execute` call.");

  console.info("Adding `execute` to language pack dependency list.")

  languageCallExpressions.push('execute')

  ast.program.body = [
    b.expressionStatement(
      b.callExpression( b.identifier('execute'), ast.rootExpressions )
    )
  ]

  // =======================================================================
  // Dependency Injector
  // =======================================================================

  console.info("Injecting language pack dependencies.")
  let expression = ast.program.body[0].expression

  let injectedCallExpression = b.callExpression(
    b.functionExpression(
      null,
      languageCallExpressions.sort().map(b.identifier),
      b.blockStatement([
        b.returnStatement( expression )
      ])
    ),
    languageCallExpressions.sort().map(name => {
      return b.memberExpression(b.identifier('languagePack'), b.identifier(name))
    })

  )

  // =======================================================================
  // Main Function
  // =======================================================================

  let executeChain = estemplate(
    `
      function main(initialState) {
        var expression = <%= expressionStatement %>;

        expression(initialState)
          .catch(function(e) {
            console.error(e)
            process.exitCode = 1
          })
          .then(function(state) {
            console.log(state)
          });

      }
      `, {
        expressionStatement: injectedCallExpression
      }).body;

  let moduleReferences = languagePack.split('.')


  

  let moduleRequires
  if (moduleReferences.length > 1) {
    moduleRequires = estemplate(
      "var languagePack = require(<%= moduleName %>)[<%= memberProperty %>]",
      { 
        moduleName: b.literal(moduleReferences[0]),
        memberProperty: b.literal(moduleReferences[1])
      }
    ).body
  } else {
    moduleRequires = estemplate(
      "var languagePack = require(<%= moduleName %>)",
      { moduleName: b.literal(moduleReferences[0]) }
    ).body
  }

  let getInitialState = estemplate(
    `
      var stdin = process.stdin,
        stdout = process.stdout,
        data = '';

      stdin.setEncoding('utf8');

      stdin.on('readable', function () {
        var chunk = stdin.read();
        if (chunk === null) {
          stdin.end();
        } else {
          data += chunk;
        }

      });

      stdin.on('end', function () {

        if (data == '') {
          throw new TypeError('No data provided.')
        }

        var initialState = JSON.parse(data) || null
        main(initialState)

      });
      `, {}
  ).body


  ast.program.body = [ ...moduleRequires, ...getInitialState, ...executeChain ];

  return ast

}

module.exports = {
  transform,
  toString
};
