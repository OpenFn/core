const types = require("ast-types");
const estemplate = require('estemplate');
const { namedTypes: n, builders: b } = types;

function CompilationError({ node, description }) {
  this.value = node;
  this.start = node.loc.start;
  this.end = node.loc.end;
  this.message = `Error on line ${this.start.line}: ` + description;
  this.toString = function() {
    return this.message;
  };
}

function verify(opts) {
  return (ast) => {

    // Inject all the exported members of the module into the top of the AST.
    // This is used to infer existence of a call expression for the language pack
    // using the `scope.lookup` facility.
    ast.program.body.unshift(estemplate(
      `const <%= members %> = AdaptorStub;`,
      {
        members: b.objectPattern(
          Object.keys(opts.sandbox)
            .map(b.identifier)
            .map(id => b.property("init", id, id))
        )
      }).body[0])

    types.visit(ast, {
      // This method will be called for any node with .type "CallExpression":
      visitCallExpression: function(path) {
        var node = path.node;

        // If a callExpression's callee is also a callExpression
        // then we can assume state is being injected.
        // i.e. operation(...args)(state)
        if ( n.Identifier.check(node.callee) ) {
          // We only track callees with identity.
          // So skip over over outer callExpressions.

          if (path.scope.lookup(node.callee.name)) {
            // ast.callExpressions.push(node);
          } else { ast.program.errors.push(
            { node, description: "Function not available." }
          ) }

          // column : 26
          // description : "Strict mode code may not include a with statement"
          // index : 171
          // lineNumber : 14

        }

        if ( n.MemberExpression.check(node.callee) && n.Identifier.check(node.callee.object) ) {
          if (path.scope.lookup(node.callee.object.name)) {
            // ast.callExpressions.push(node);
          } else {
            ast.program.errors.push(
              new CompilationError({ node, description: "Function not available." })
            ) 
          }
        }

        this.traverse(path);
      }
    });

    // Remove the sandbox injection.
    ast.program.body.shift();

    return ast;
  }
}

function wrapRootExpressions(ident) {
  return ast => {
    ast.rootExpressions = []

    types.visit(ast, {
      visitCallExpression: function(path) {
        var node = path.node;

        ast.rootExpressions.push(node);

        return false;
      }
    });

    ast.program.body = [
      b.expressionStatement(
        b.callExpression( b.identifier(ident), ast.rootExpressions )
      )
    ]

    return ast;
  }
}

function callFunction(call, ident) {
  return ast => {
    types.visit(ast, {
      visitCallExpression: function(path) {
        var node = path.node;

        // If a callExpression's callee is also a callExpression
        // then we can assume state is being injected.
        // i.e. operation(...args)(state)
        if (n.Identifier.check(node.callee) && node.callee.name == call) {
          path.replace(b.callExpression( node, [b.identifier(ident)] ));
        }

        return false;
      }
    });

    return ast;
  }
}

function wrapIIFE() {
  return ast => {
    ast.program.body = [
      b.expressionStatement(
        b.callExpression(
          b.functionExpression( null, [],
            b.blockStatement([
              b.returnStatement( ast.program.body[0].expression )
            ]) ),
          []
        )
      )
    ]
    return ast;
  }
}

module.exports = { verify, wrapRootExpressions, callFunction, wrapIIFE };
