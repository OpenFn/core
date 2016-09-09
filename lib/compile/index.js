const recast = require('recast')

function ParseFailure(value) {
   this.value = value;
   this.message = "Failed to parse expression.";
   this.toString = function() {
      return this.message + "\n" + this.value.message;
   };
}

class Compile {
  constructor(ast, transforms=[]) {
    try {
      if (typeof ast === 'string')
        ast = recast.parse(ast, { tolerant: true, range: true })

      this.ast = transforms.reduce((ast, transform) => {
        const next = transform(ast);

        if (!next) {
          throw new Error(`A transform unexpectedly returned ${next}`)
        }

        return next;
      }, ast)

      Object.defineProperty(this, 'errors', {
        get: function() {
          return this.ast.program.errors;
        }
      });

    } catch (e) {
      throw new ParseFailure(e)
    }
  }

  toString() {
    return recast.print(this.ast).code;
  }

}


module.exports = Compile;
