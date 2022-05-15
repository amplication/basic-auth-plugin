import * as recast from "recast";
import { ParserOptions } from "@babel/parser";
import { ASTNode, namedTypes } from "ast-types";
import * as K from "ast-types/gen/kinds";
import { NodePath } from "ast-types/lib/node-path";
export declare type ClassDeclaration = namedTypes.ClassDeclaration & {
    decorators: namedTypes.Decorator[];
};
export declare type NamedClassDeclaration = ClassDeclaration & {
    id: namedTypes.Identifier;
};
export declare type NamedClassProperty = namedTypes.ClassProperty & {
    key: namedTypes.Identifier;
    typeAnnotation: namedTypes.TSTypeAnnotation;
    optional?: boolean;
};
declare type ParseOptions = Omit<recast.Options, "parser">;
declare type PartialParseOptions = Omit<ParserOptions, "tolerant">;
export declare class ParseError extends SyntaxError {
    constructor(message: string, source: string);
}
/**
 * Wraps recast.parse()
 * Sets parser to use the TypeScript parser
 */
export declare function parse(source: string, options?: ParseOptions): namedTypes.File;
/**
 * Wraps recast.parse()
 * Sets parser to use the TypeScript parser with looser restrictions
 */
export declare function partialParse(source: string, options?: PartialParseOptions): namedTypes.File;
/**
 * Extract all the import declarations from given file
 * @param file file AST representation
 * @returns array of import declarations ast nodes
 */
export declare function extractImportDeclarations(file: namedTypes.File): namedTypes.ImportDeclaration[];
/**
 * @param code JavaScript module code to get exported names from
 * @returns exported names
 */
export declare function getExportedNames(code: string): Array<namedTypes.Identifier | namedTypes.JSXIdentifier | namedTypes.TSTypeParameter>;
/**
 * In given AST replaces identifiers with AST nodes according to given mapping
 * @param ast AST to replace identifiers in
 * @param mapping from identifier to AST node to replace it with
 */
export declare function interpolate(ast: ASTNode, mapping: {
    [key: string]: ASTNode | undefined;
}): void;
export declare function evaluateJSX(path: NodePath, mapping: {
    [key: string]: ASTNode | undefined;
}): void;
export declare function transformTemplateLiteralToStringLiteral(templateLiteral: namedTypes.TemplateLiteral): namedTypes.StringLiteral;
/**
 * Removes all TypeScript ignore comments
 * @param ast the AST to remove the comments from
 */
export declare function removeTSIgnoreComments(ast: ASTNode): void;
/**
 * Like removeTSIgnoreComments but removes TypeScript ignore comments from
 * imports only
 * @param file file to remove comments from
 */
export declare function removeImportsTSIgnoreComments(file: namedTypes.File): void;
/**
 * Removes all TypeScript variable declares
 * @param ast the AST to remove the declares from
 */
export declare function removeTSVariableDeclares(ast: ASTNode): void;
/**
 * Removes all TypeScript class declares
 * @param ast the AST to remove the declares from
 */
export declare function removeTSClassDeclares(ast: ASTNode): void;
/**
 * Removes all TypeScript interface declares
 * @param ast the AST to remove the declares from
 */
export declare function removeTSInterfaceDeclares(ast: ASTNode): void;
/**
 * Removes all ESLint comments
 * @param ast the AST to remove the comments from
 */
export declare function removeESLintComments(ast: ASTNode): void;
/**
 * Adds auto-generated static comments to top of given file
 * @param file file to add comments to
 */
export declare function addAutoGenerationComment(file: namedTypes.File): void;
export declare function importNames(names: namedTypes.Identifier[], source: string): namedTypes.ImportDeclaration;
export declare function addImports(file: namedTypes.File, imports: namedTypes.ImportDeclaration[]): void;
export declare function exportNames(names: namedTypes.Identifier[]): namedTypes.ExportNamedDeclaration;
export declare function classDeclaration(id: K.IdentifierKind | null, body: K.ClassBodyKind, superClass?: K.ExpressionKind | null, decorators?: namedTypes.Decorator[]): namedTypes.ClassDeclaration;
export declare function classProperty(key: namedTypes.Identifier, typeAnnotation: namedTypes.TSTypeAnnotation, definitive?: boolean, optional?: boolean, defaultValue?: namedTypes.Expression | null, decorators?: namedTypes.Decorator[]): namedTypes.ClassProperty;
export declare function findContainedIdentifiers(node: ASTNode, identifiers: Iterable<namedTypes.Identifier>): namedTypes.Identifier[];
/**
 * Finds class declaration in provided AST node, if no class is found throws an exception
 * @param node AST node which includes the desired class declaration
 * @param id the identifier of the desired class
 * @returns a class declaration with a matching identifier to the one given in the given AST node
 */
export declare function getClassDeclarationById(node: ASTNode, id: namedTypes.Identifier): namedTypes.ClassDeclaration;
export declare function deleteClassMemberByKey(declaration: namedTypes.ClassDeclaration, id: namedTypes.Identifier): void;
export declare function importContainedIdentifiers(node: ASTNode, moduleToIdentifiers: Record<string, namedTypes.Identifier[]>): namedTypes.ImportDeclaration[];
export declare function isConstructor(method: namedTypes.ClassMethod): boolean;
/**
 * Returns the constructor of the given classDeclaration
 * @param classDeclaration
 */
export declare function findConstructor(classDeclaration: namedTypes.ClassDeclaration): namedTypes.ClassMethod | undefined;
/**
 * Add an identifier to the super() call in the constructor
 * @param classDeclaration
 */
export declare function addIdentifierToConstructorSuperCall(ast: ASTNode, identifier: namedTypes.Identifier): void;
export declare function getMethods(classDeclaration: namedTypes.ClassDeclaration): namedTypes.ClassMethod[];
export declare function getNamedProperties(declaration: namedTypes.ClassDeclaration): NamedClassProperty[];
export declare const importDeclaration: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.ImportDeclaration;
export declare const callExpression: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.CallExpression;
export declare const memberExpression: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.MemberExpression;
export declare const awaitExpression: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.AwaitExpression;
export declare const logicalExpression: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.LogicalExpression;
export declare const expressionStatement: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.ExpressionStatement;
export declare function typedExpression<T>(type: {
    check(v: any): v is T;
}): (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => T;
export declare function typedStatement<T>(type: {
    check(v: any): v is T;
}): (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => T;
export declare function expression(strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>): namedTypes.Expression;
export declare function statement(strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>): namedTypes.Statement;
export declare function findFirstDecoratorByName(node: ASTNode, decoratorName: string): namedTypes.Decorator;
export declare function createGenericArray(itemType: K.TSTypeKind): namedTypes.TSTypeReference;
export declare function pushIdentifierToModuleSection(file: namedTypes.File, section: string, identifier: namedTypes.Identifier): void;
export {};
