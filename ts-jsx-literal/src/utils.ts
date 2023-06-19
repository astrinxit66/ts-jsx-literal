import * as ts from "typescript";

export class Node<T extends ts.Node> {
  constructor(private node?: T) {}
  getNode(): T {
    if (this.node === undefined) {
      throw new Error("Node has not been set");
    }
    return this.node;
  }
}

export class Expression<T extends ts.Expression> extends Node<T> {
  call(...args: ts.Expression[]) {
    return new Expression(ts.factory.createCallExpression(this.getNode(), [], args));
  }
  access(name: string | ts.Identifier) {
    return new Expression(ts.factory.createPropertyAccessExpression(this.getNode(), name));
  }
}

export class Identifier extends Expression<ts.Identifier> {
  constructor(name: string) {
    super(ts.factory.createIdentifier(name));
  }
}

export class ArrowFunction extends Expression<ts.ArrowFunction> {
  protected parameters: ts.ParameterDeclaration[] = [];
  protected body: ts.Expression | null = null;
  constructor(
    parameters: (ts.ParameterDeclaration | string[])[] = [],
    body: ts.Expression | null = null
  ) {
    super();
    this.addParameter(...parameters);
    if (body) this.setBody(body);
  }
  addParameter(...parameters: (ts.ParameterDeclaration | string[])[]) {
    this.parameters = this.parameters.concat(
      parameters.map(p => {
        if (Array.isArray(p)) {
          return createParameter(
            ts.factory.createArrayBindingPattern(p.map(createBindingElement))
          );
        }
        return p;
      })
    );
    return this;
  }
  setBody(body: ts.Expression) {
    this.body = body;
    return this;
  }
  getNode() {
    if (this.body === null) {
      throw new Error(
        "Cannot create arrow function because body hasn't been set"
      );
    }
    return ts.factory.createArrowFunction(
      undefined,
      undefined,
      this.parameters,
      undefined,
      undefined,
      this.body
    );
  }
}

export class StringTemplateHelper extends Expression<
  ts.TemplateExpression | ts.StringLiteral | ts.Expression
> {
  private body: [ts.Expression, string][] = [[null as any, ""]];
  constructor(...els: (ts.Expression | string)[]) {
    super();
    this.add(...els);
  }
  public add(...elements: (ts.Expression | string)[]) {
    for (const element of elements) {
      if (typeof element === "string") {
        this.body[this.body.length - 1][1] += element;
      } else {
        this.body.push([element, ""]);
      }
    }
  }
  getNode() {
    if (this.body.length === 1) return ts.factory.createStringLiteral(this.body[0][1]);
    if (
      this.body.length === 2 &&
      this.body[0][1] === "" &&
      this.body[1][1] === ""
    ) {
      return this.body[1][0];
    }
    const head = ts.factory.createTemplateHead(this.body[0][1]);
    const body = this.body.slice(1).map(([node, lit], index, arr) => {
      return ts.factory.createTemplateSpan(
        node,
        index === arr.length - 1
          ? ts.factory.createTemplateTail(lit)
          : ts.factory.createTemplateMiddle(lit)
      );
    });
    return ts.factory.createTemplateExpression(head, body);
  }
}

function createParameter(name: string | ts.ArrayBindingPattern) {
  return ts.factory.createParameterDeclaration(undefined, undefined, name);
}

function createBindingElement(name: string): ts.BindingElement {
  return ts.factory.createBindingElement(undefined, undefined, name, undefined);
}
