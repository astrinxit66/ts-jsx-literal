import * as ts from "typescript";
import * as utils from "./utils";

const grabJsx = [
  ts.SyntaxKind.JsxElement,
  ts.SyntaxKind.JsxFragment,
  ts.SyntaxKind.JsxSelfClosingElement,
];

class Transformer {
  private typeChecker: ts.TypeChecker | undefined;
  constructor(
    program: ts.Program | undefined,
    private context: ts.TransformationContext
  ) {
    this.typeChecker = program && program.getTypeChecker();
  }

  getStringFromClosingElement(
    node: ts.JsxClosingElement,
    result: utils.StringTemplateHelper
  ) {
    result.add(`</${node.tagName.getText()}>`);
  }

  getStringFromJsxSpreadAttribute(
    node: ts.JsxSpreadAttribute,
    result: utils.StringTemplateHelper
  ) {
    result.add(
      " ",
      new utils.Identifier("Object")
        .access("entries")
        .call(node.expression)
        .access("map")
        .call(
          new utils.ArrowFunction(
            [["key", "value"]],
            new utils.StringTemplateHelper(
              ts.factory.createIdentifier("key"),
              '="',
              ts.factory.createIdentifier("value"),
              '"'
            ).getNode()
          ).getNode()
        )
        .access("join")
        .call(ts.factory.createStringLiteral(" "))
        .getNode()
    );
  }

  getStringFromAttribute(
    node: ts.JsxAttribute,
    result: utils.StringTemplateHelper
  ) {
    if (
      node.initializer &&
      node.initializer.kind === ts.SyntaxKind.JsxExpression
    ) {
      result.add(
        ` ${node.name.getText()}="`,
        node.initializer.expression!,
        `"`
      );
    } else {
      result.add(" " + node.getText());
    }
  }

  getStringFromAttributes(
    node: ts.JsxAttributes,
    result: utils.StringTemplateHelper
  ) {
    for (const property of node.properties) {
      if (property.kind === ts.SyntaxKind.JsxSpreadAttribute) {
        this.getStringFromJsxSpreadAttribute(property, result);
      } else {
        this.getStringFromAttribute(property, result);
      }
    }
  }

  getStringFromOpeningElement(
    node: ts.JsxOpeningElement,
    result: utils.StringTemplateHelper
  ) {
    result.add(`<${node.tagName.getText()}`);
    this.getStringFromAttributes(node.attributes, result);
    result.add(">");
  }

  getObjectLiteralElementFromAttribute(
    property: ts.JsxAttributeLike
  ): ts.ObjectLiteralElementLike {
    if (property.kind === ts.SyntaxKind.JsxSpreadAttribute) {
      return ts.factory.createSpreadAssignment(property.expression);
    }
    const name = property.name.getText();
    const value = property.initializer
      ? property.initializer.kind === ts.SyntaxKind.JsxExpression
        ? property.initializer.expression!
        : ts.factory.createStringLiteral((property.initializer as ts.StringLiteral).text)
      : ts.factory.createTrue();
    return ts.factory.createPropertyAssignment(name, value as ts.Expression);
  }

  getStringFromJsxElementComponent(
    node: ts.JsxElement,
    result: utils.StringTemplateHelper
  ) {
    const parameters: ts.ObjectLiteralElementLike[] = node.openingElement.attributes.properties.map(
      this.getObjectLiteralElementFromAttribute.bind(this)
    );
    const childrenResult = new utils.StringTemplateHelper();
    for (const child of node.children) {
      this.getStringFromJsxChild(child, childrenResult);
    }
    const childrenParameter = ts.factory.createPropertyAssignment(
      "children",
      childrenResult.getNode()
    );
    parameters.push(childrenParameter);
    result.add(
      ts.factory.createCallExpression(
        node.openingElement.tagName as ts.Expression,
        [],
        [ts.factory.createObjectLiteralExpression(parameters)]
      )
    );
  }

  getStringFromJsxElement(
    node: ts.JsxElement,
    result: utils.StringTemplateHelper
  ) {
    if (node.openingElement.tagName.getText().match(/[A-Z]/)) {
      this.getStringFromJsxElementComponent(node, result);
      return;
    }
    this.getStringFromOpeningElement(node.openingElement, result);
    for (const child of node.children) {
      this.getStringFromJsxChild(child, result);
    }
    this.getStringFromClosingElement(node.closingElement, result);
  }

  getStringFromJsxFragment(
    node: ts.JsxFragment,
    result: utils.StringTemplateHelper
  ) {
    for (const child of node.children) {
      this.getStringFromJsxChild(child, result);
    }
  }

  getStringFromJsxSelfClosingElementComponent(
    node: ts.JsxSelfClosingElement,
    result: utils.StringTemplateHelper
  ) {
    let parameters: ts.ObjectLiteralElementLike[] = [];
    parameters.push(
      ts.factory.createPropertyAssignment("children", ts.factory.createStringLiteral(""))
    );
    parameters = parameters.concat(
      node.attributes.properties.map((property) =>
        this.getObjectLiteralElementFromAttribute(property)
      )
    );
    result.add(
      ts.factory.createCallExpression(node.tagName as ts.Expression, [], [ts.factory.createObjectLiteralExpression(parameters)])
    );
  }

  getStringFromJsxSelfClosingElement(
    node: ts.JsxSelfClosingElement,
    result: utils.StringTemplateHelper
  ) {
    if (node.tagName.getText().match(/[A-Z]/)) {
      this.getStringFromJsxSelfClosingElementComponent(node, result);
      return;
    }
    result.add("<", node.tagName.getText());
    this.getStringFromAttributes(node.attributes, result);
    result.add("/>");
  }

  getStringFromJsxExpression(
    node: ts.JsxExpression,
    result: utils.StringTemplateHelper
  ) {
    const newNode = ts.visitNode(node.expression!, this.visit.bind(this));
    if (this.typeChecker) {
      const type = this.typeChecker.getTypeAtLocation(newNode);
      const symbol = type.getSymbol();
      if (symbol && symbol.getName() === "Array") {
        result.add(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(newNode as ts.ArrayLiteralExpression, "join"),
            [],
            [ts.factory.createStringLiteral("")]
          )
        );
      } else {
        result.add(newNode as ts.Expression);
      }
    } else {
      result.add(newNode as ts.Expression);
    }
  }

  getStringFromJsxChild(node: ts.JsxChild, result: utils.StringTemplateHelper) {
    switch (node.kind) {
      case ts.SyntaxKind.JsxElement:
        this.getStringFromJsxElement(node, result);
        break;
      case ts.SyntaxKind.JsxFragment:
        this.getStringFromJsxFragment(node, result);
        break;
      case ts.SyntaxKind.JsxSelfClosingElement:
        this.getStringFromJsxSelfClosingElement(node, result);
        break;
      case ts.SyntaxKind.JsxText:
        const text = node
          .getFullText()
          .replace(/^\n* */g, "")
          .replace(/\n* *$/g, "")
          .replace(/\n+ */g, " ");
        result.add(text);
        break;
      case ts.SyntaxKind.JsxExpression:
        this.getStringFromJsxExpression(node, result);
        break;
      default:
        throw new Error("NOT IMPLEMENTED"); // TODO improve error message
    }
    return result;
  }

  visit(node: ts.Node): ts.Node {
    if (grabJsx.indexOf(node.kind) !== -1) {
      const result = new utils.StringTemplateHelper();
      this.getStringFromJsxChild(node as ts.JsxChild, result);
      return result.getNode();
    }
    return ts.visitEachChild(node, this.visit.bind(this), this.context);
  }

  transform<T extends ts.Node>(rootNode: T): ts.Node | (ts.Node & undefined) {
    return ts.visitNode(rootNode, this.visit.bind(this));
  }
}

function transformer<T extends ts.Node>(
  program: ts.Program
): ts.TransformerFactory<T>;
function transformer<T extends ts.Node>(
  context: ts.TransformationContext
): ts.Transformer<T>;
function transformer<T extends ts.Node>(
  programOrContext: ts.Program | ts.TransformationContext
) {
  if (isProgram(programOrContext)) {
    return (context: ts.TransformationContext) => (node: T) =>
      new Transformer(programOrContext, context).transform(node);
  }
  return (node: T) =>
    new Transformer(undefined, programOrContext).transform(node);
}

function isProgram(t: object): t is ts.Program {
  return "getTypeChecker" in t;
}

export default transformer;
