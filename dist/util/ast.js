"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushIdentifierToModuleSection = exports.createGenericArray = exports.findFirstDecoratorByName = exports.statement = exports.expression = exports.typedStatement = exports.typedExpression = exports.expressionStatement = exports.logicalExpression = exports.awaitExpression = exports.memberExpression = exports.callExpression = exports.importDeclaration = exports.getNamedProperties = exports.getMethods = exports.addIdentifierToConstructorSuperCall = exports.findConstructor = exports.isConstructor = exports.importContainedIdentifiers = exports.deleteClassMemberByKey = exports.getClassDeclarationById = exports.findContainedIdentifiers = exports.classProperty = exports.classDeclaration = exports.exportNames = exports.addImports = exports.importNames = exports.addAutoGenerationComment = exports.removeESLintComments = exports.removeTSInterfaceDeclares = exports.removeTSClassDeclares = exports.removeTSVariableDeclares = exports.removeImportsTSIgnoreComments = exports.removeTSIgnoreComments = exports.transformTemplateLiteralToStringLiteral = exports.evaluateJSX = exports.interpolate = exports.getExportedNames = exports.extractImportDeclarations = exports.partialParse = exports.parse = exports.ParseError = void 0;
const tslib_1 = require("tslib");
const recast = tslib_1.__importStar(require("recast"));
const ast_types_1 = require("ast-types");
const lodash_1 = require("lodash");
const parser = tslib_1.__importStar(require("./parser"));
const partialParser = tslib_1.__importStar(require("./partial-parser"));
const TS_IGNORE_TEXT = "@ts-ignore";
const CONSTRUCTOR_NAME = "constructor";
const ARRAY_ID = ast_types_1.builders.identifier("Array");
const STATIC_COMMENT = `
------------------------------------------------------------------------------ 
This code was generated by Amplication. 
 
Changes to this file will be lost if the code is regenerated. 

There are other ways to to customize your code, see this doc to learn more
https://docs.amplication.com/docs/how-to/custom-code

------------------------------------------------------------------------------
  `;
class ParseError extends SyntaxError {
    constructor(message, source) {
        super(`${message}\nSource:\n${source}`);
    }
}
exports.ParseError = ParseError;
/**
 * Wraps recast.parse()
 * Sets parser to use the TypeScript parser
 */
function parse(source, options) {
    try {
        return recast.parse(source, {
            ...options,
            parser,
        });
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            throw new ParseError(error.message, source);
        }
        throw error;
    }
}
exports.parse = parse;
/**
 * Wraps recast.parse()
 * Sets parser to use the TypeScript parser with looser restrictions
 */
function partialParse(source, options) {
    try {
        return recast.parse(source, {
            ...options,
            tolerant: true,
            parser: partialParser,
        });
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            throw new ParseError(error.message, source);
        }
        throw error;
    }
}
exports.partialParse = partialParse;
/**
 * Consolidate import declarations to a valid minimal representation
 * @todo handle multiple local imports
 * @todo handle multiple namespace, default
 * @param declarations import declarations to consolidate
 * @returns consolidated array of import declarations
 */
function consolidateImports(declarations) {
    const moduleToDeclarations = (0, lodash_1.groupBy)(declarations, (declaration) => declaration.source.value);
    const moduleToDeclaration = (0, lodash_1.mapValues)(moduleToDeclarations, (declarations, module) => {
        const specifiers = (0, lodash_1.uniqBy)(declarations.flatMap((declaration) => declaration.specifiers || []), (specifier) => {
            if (ast_types_1.namedTypes.ImportSpecifier.check(specifier)) {
                return specifier.imported.name;
            }
            return specifier.type;
        });
        return ast_types_1.builders.importDeclaration(specifiers, ast_types_1.builders.stringLiteral(module));
    });
    return Object.values(moduleToDeclaration);
}
/**
 * Extract all the import declarations from given file
 * @param file file AST representation
 * @returns array of import declarations ast nodes
 */
function extractImportDeclarations(file) {
    const newBody = [];
    const imports = [];
    for (const statement of file.program.body) {
        if (ast_types_1.namedTypes.ImportDeclaration.check(statement)) {
            imports.push(statement);
        }
        else {
            newBody.push(statement);
        }
    }
    file.program.body = newBody;
    return imports;
}
exports.extractImportDeclarations = extractImportDeclarations;
/**
 * @param code JavaScript module code to get exported names from
 * @returns exported names
 */
function getExportedNames(code) {
    const file = parse(code);
    const ids = [];
    for (const node of file.program.body) {
        if (ast_types_1.namedTypes.ExportNamedDeclaration.check(node)) {
            if (!node.declaration) {
                throw new Error("Not implemented");
            }
            if ("id" in node.declaration &&
                node.declaration.id &&
                "name" in node.declaration.id) {
                ids.push(node.declaration.id);
            }
            else if ("declarations" in node.declaration) {
                for (const declaration of node.declaration.declarations) {
                    if ("id" in declaration &&
                        declaration.id &&
                        "name" in declaration.id) {
                        ids.push(declaration.id);
                    }
                    else {
                        throw new Error("Not implemented");
                    }
                }
            }
            else {
                throw new Error("Not implemented");
            }
        }
    }
    return ids;
}
exports.getExportedNames = getExportedNames;
/**
 * In given AST replaces identifiers with AST nodes according to given mapping
 * @param ast AST to replace identifiers in
 * @param mapping from identifier to AST node to replace it with
 */
function interpolate(ast, mapping) {
    return recast.visit(ast, {
        visitIdentifier(path) {
            const { name } = path.node;
            if (mapping.hasOwnProperty(name)) {
                const replacement = mapping[name];
                path.replace(replacement);
            }
            this.traverse(path);
        },
        // Recast has a bug of traversing class decorators
        // This method fixes it
        visitClassDeclaration(path) {
            const childPath = path.get("decorators");
            if (childPath.value) {
                this.traverse(childPath);
            }
            return this.traverse(path);
        },
        // Recast has a bug of traversing class property decorators
        // This method fixes it
        visitClassProperty(path) {
            const childPath = path.get("decorators");
            if (childPath.value) {
                this.traverse(childPath);
            }
            this.traverse(path);
        },
        // Recast has a bug of traversing TypeScript call expression type parameters
        visitCallExpression(path) {
            const childPath = path.get("typeParameters");
            if (childPath.value) {
                this.traverse(childPath);
            }
            this.traverse(path);
        },
        /**
         * Template literals that only hold identifiers mapped to string literals
         * are statically evaluated to string literals.
         * @example
         * ```
         * const file = parse("`Hello, ${NAME}!`");
         * interpolate(file, { NAME: builders.stringLiteral("World") });
         * print(file).code === '"Hello, World!"';
         * ```
         */
        visitTemplateLiteral(path) {
            const canTransformToStringLiteral = path.node.expressions.every((expression) => ast_types_1.namedTypes.Identifier.check(expression) &&
                expression.name in mapping &&
                ast_types_1.namedTypes.StringLiteral.check(mapping[expression.name]));
            if (canTransformToStringLiteral) {
                path.node.expressions = path.node.expressions.map((expression) => {
                    const identifier = expression;
                    return mapping[identifier.name];
                });
                path.replace(transformTemplateLiteralToStringLiteral(path.node));
            }
            this.traverse(path);
        },
        visitJSXElement(path) {
            evaluateJSX(path, mapping);
            this.traverse(path);
        },
        visitJSXFragment(path) {
            evaluateJSX(path, mapping);
            this.traverse(path);
        },
    });
}
exports.interpolate = interpolate;
function evaluateJSX(path, mapping) {
    const childrenPath = path.get("children");
    childrenPath.each((childPath) => {
        const { node } = childPath;
        if (ast_types_1.namedTypes.JSXExpressionContainer.check(node) &&
            ast_types_1.namedTypes.Identifier.check(node.expression)) {
            const { expression } = node;
            const mapped = mapping[expression.name];
            if (ast_types_1.namedTypes.JSXElement.check(mapped)) {
                childPath.replace(mapped);
            }
            else if (ast_types_1.namedTypes.StringLiteral.check(mapped)) {
                childPath.replace(ast_types_1.builders.jsxText(mapped.value));
            }
            else if (ast_types_1.namedTypes.JSXFragment.check(mapped) && mapped.children) {
                childPath.replace(...mapped.children);
            }
        }
    });
}
exports.evaluateJSX = evaluateJSX;
function transformTemplateLiteralToStringLiteral(templateLiteral) {
    const value = templateLiteral.quasis
        .map((quasie, i) => {
        const expression = templateLiteral.expressions[i];
        if (expression) {
            return quasie.value.raw + expression.value;
        }
        return quasie.value.raw;
    })
        .join("");
    return ast_types_1.builders.stringLiteral(value);
}
exports.transformTemplateLiteralToStringLiteral = transformTemplateLiteralToStringLiteral;
/**
 * Removes all TypeScript ignore comments
 * @param ast the AST to remove the comments from
 */
function removeTSIgnoreComments(ast) {
    recast.visit(ast, {
        visitComment(path) {
            if (path.value.value.includes(TS_IGNORE_TEXT)) {
                path.prune();
            }
            this.traverse(path);
        },
    });
}
exports.removeTSIgnoreComments = removeTSIgnoreComments;
/**
 * Like removeTSIgnoreComments but removes TypeScript ignore comments from
 * imports only
 * @param file file to remove comments from
 */
function removeImportsTSIgnoreComments(file) {
    for (const statement of file.program.body) {
        if (!ast_types_1.namedTypes.ImportDeclaration.check(statement)) {
            break;
        }
        removeTSIgnoreComments(statement);
    }
}
exports.removeImportsTSIgnoreComments = removeImportsTSIgnoreComments;
/**
 * Removes all TypeScript variable declares
 * @param ast the AST to remove the declares from
 */
function removeTSVariableDeclares(ast) {
    recast.visit(ast, {
        visitVariableDeclaration(path) {
            if (path.get("declare").value) {
                path.prune();
            }
            this.traverse(path);
        },
    });
}
exports.removeTSVariableDeclares = removeTSVariableDeclares;
/**
 * Removes all TypeScript class declares
 * @param ast the AST to remove the declares from
 */
function removeTSClassDeclares(ast) {
    recast.visit(ast, {
        visitClassDeclaration(path) {
            if (path.get("declare").value) {
                path.prune();
            }
            this.traverse(path);
        },
    });
}
exports.removeTSClassDeclares = removeTSClassDeclares;
/**
 * Removes all TypeScript interface declares
 * @param ast the AST to remove the declares from
 */
function removeTSInterfaceDeclares(ast) {
    recast.visit(ast, {
        visitTSInterfaceDeclaration(path) {
            if (path.get("declare").value) {
                path.prune();
            }
            this.traverse(path);
        },
    });
}
exports.removeTSInterfaceDeclares = removeTSInterfaceDeclares;
/**
 * Removes all ESLint comments
 * @param ast the AST to remove the comments from
 */
function removeESLintComments(ast) {
    recast.visit(ast, {
        visitComment(path) {
            const comment = path.value;
            if (comment.value.match(/^\s+eslint-disable/)) {
                path.prune();
            }
            this.traverse(path);
        },
    });
}
exports.removeESLintComments = removeESLintComments;
/**
 * Adds auto-generated static comments to top of given file
 * @param file file to add comments to
 */
function addAutoGenerationComment(file) {
    const autoGen = ast_types_1.builders.commentBlock(STATIC_COMMENT, true);
    if (!file.comments) {
        file.comments = [];
    }
    file.comments.unshift(autoGen);
}
exports.addAutoGenerationComment = addAutoGenerationComment;
function importNames(names, source) {
    return ast_types_1.builders.importDeclaration(names.map((name) => ast_types_1.builders.importSpecifier(name)), ast_types_1.builders.stringLiteral(source));
}
exports.importNames = importNames;
function addImports(file, imports) {
    const existingImports = extractImportDeclarations(file);
    const consolidatedImports = consolidateImports([
        ...existingImports,
        ...imports,
    ]);
    file.program.body.unshift(...consolidatedImports);
}
exports.addImports = addImports;
function exportNames(names) {
    return ast_types_1.builders.exportNamedDeclaration(null, names.map((name) => ast_types_1.builders.exportSpecifier.from({
        exported: name,
        id: name,
        name,
    })));
}
exports.exportNames = exportNames;
function classDeclaration(id, body, superClass = null, decorators = []) {
    const declaration = ast_types_1.builders.classDeclaration(id, body, superClass);
    if (!decorators.length) {
        return declaration;
    }
    const code = [
        ...decorators.map((decorator) => recast.print(decorator).code),
        recast.print(declaration).code,
    ].join("\n");
    const ast = parse(code);
    const [classDeclaration] = ast.program.body;
    return classDeclaration;
}
exports.classDeclaration = classDeclaration;
function classProperty(key, typeAnnotation, definitive = false, optional = false, defaultValue = null, decorators = []) {
    if (optional && definitive) {
        throw new Error("Must either provide definitive: true, optional: true or none of them");
    }
    const code = `class A {
    ${decorators.map((decorator) => recast.print(decorator).code).join("\n")}
    ${recast.print(key).code}${definitive ? "!" : ""}${optional ? "?" : ""}${recast.print(typeAnnotation).code}${defaultValue ? `= ${recast.print(defaultValue).code}` : ""}
  
  }`;
    const ast = parse(code);
    const [classDeclaration] = ast.program.body;
    const [property] = classDeclaration.body.body;
    return property;
}
exports.classProperty = classProperty;
function findContainedIdentifiers(node, identifiers) {
    const nameToIdentifier = Object.fromEntries(Array.from(identifiers, (identifier) => [identifier.name, identifier]));
    const contained = [];
    recast.visit(node, {
        visitIdentifier(path) {
            if (nameToIdentifier.hasOwnProperty(path.node.name)) {
                contained.push(path.node);
            }
            this.traverse(path);
        },
        // Recast has a bug of traversing class decorators
        // This method fixes it
        visitClassDeclaration(path) {
            const childPath = path.get("decorators");
            if (childPath.value) {
                this.traverse(childPath);
            }
            return this.traverse(path);
        },
        // Recast has a bug of traversing class property decorators
        // This method fixes it
        visitClassProperty(path) {
            const childPath = path.get("decorators");
            if (childPath.value) {
                this.traverse(childPath);
            }
            this.traverse(path);
        },
    });
    return contained;
}
exports.findContainedIdentifiers = findContainedIdentifiers;
/**
 * Finds class declaration in provided AST node, if no class is found throws an exception
 * @param node AST node which includes the desired class declaration
 * @param id the identifier of the desired class
 * @returns a class declaration with a matching identifier to the one given in the given AST node
 */
function getClassDeclarationById(node, id) {
    let classDeclaration = null;
    recast.visit(node, {
        visitClassDeclaration(path) {
            if (path.node.id && path.node.id.name === id.name) {
                classDeclaration = path.node;
                return false;
            }
            return this.traverse(path);
        },
    });
    if (!classDeclaration) {
        throw new Error(`Could not find class declaration with the identifier ${id.name} in provided AST node`);
    }
    return classDeclaration;
}
exports.getClassDeclarationById = getClassDeclarationById;
function deleteClassMemberByKey(declaration, id) {
    for (const [index, member] of declaration.body.body.entries()) {
        if (member &&
            "key" in member &&
            ast_types_1.namedTypes.Identifier.check(member.key) &&
            member.key.name === id.name) {
            delete declaration.body.body[index];
            break;
        }
    }
}
exports.deleteClassMemberByKey = deleteClassMemberByKey;
function importContainedIdentifiers(node, moduleToIdentifiers) {
    const idToModule = new Map(Object.entries(moduleToIdentifiers).flatMap(([key, values]) => values.map((value) => [value, key])));
    const nameToId = Object.fromEntries(Array.from(idToModule.keys(), (identifier) => [identifier.name, identifier]));
    const containedIds = findContainedIdentifiers(node, idToModule.keys());
    const moduleToContainedIds = (0, lodash_1.groupBy)(containedIds, (id) => {
        const knownId = nameToId[id.name];
        const module = idToModule.get(knownId);
        return module;
    });
    return Object.entries(moduleToContainedIds).map(([module, containedIds]) => importNames(containedIds, module));
}
exports.importContainedIdentifiers = importContainedIdentifiers;
function isConstructor(method) {
    return (ast_types_1.namedTypes.Identifier.check(method.key) &&
        method.key.name === CONSTRUCTOR_NAME);
}
exports.isConstructor = isConstructor;
/**
 * Returns the constructor of the given classDeclaration
 * @param classDeclaration
 */
function findConstructor(classDeclaration) {
    return classDeclaration.body.body.find((member) => ast_types_1.namedTypes.ClassMethod.check(member) && isConstructor(member));
}
exports.findConstructor = findConstructor;
/**
 * Add an identifier to the super() call in the constructor
 * @param classDeclaration
 */
function addIdentifierToConstructorSuperCall(ast, identifier) {
    recast.visit(ast, {
        visitClassMethod(path) {
            const classMethodNode = path.node;
            if (isConstructor(classMethodNode)) {
                recast.visit(classMethodNode, {
                    visitCallExpression(path) {
                        const callExpressionNode = path.node;
                        if (callExpressionNode.callee.type === "Super") {
                            callExpressionNode.arguments.push(identifier);
                        }
                        this.traverse(path);
                    },
                });
            }
            this.traverse(path);
        },
    });
}
exports.addIdentifierToConstructorSuperCall = addIdentifierToConstructorSuperCall;
function getMethods(classDeclaration) {
    return classDeclaration.body.body.filter((member) => ast_types_1.namedTypes.ClassMethod.check(member) && !isConstructor(member));
}
exports.getMethods = getMethods;
function getNamedProperties(declaration) {
    return declaration.body.body.filter((member) => ast_types_1.namedTypes.ClassProperty.check(member) &&
        ast_types_1.namedTypes.Identifier.check(member.key));
}
exports.getNamedProperties = getNamedProperties;
exports.importDeclaration = typedStatement(ast_types_1.namedTypes.ImportDeclaration);
exports.callExpression = typedExpression(ast_types_1.namedTypes.CallExpression);
exports.memberExpression = typedExpression(ast_types_1.namedTypes.MemberExpression);
exports.awaitExpression = typedExpression(ast_types_1.namedTypes.AwaitExpression);
exports.logicalExpression = typedExpression(ast_types_1.namedTypes.LogicalExpression);
exports.expressionStatement = typedStatement(ast_types_1.namedTypes.ExpressionStatement);
function typedExpression(type) {
    return (strings, ...values) => {
        const exp = expression(strings, ...values);
        if (!type.check(exp)) {
            throw new Error(`Code must define a single ${type} at the top level`);
        }
        return exp;
    };
}
exports.typedExpression = typedExpression;
function typedStatement(type) {
    return (strings, ...values) => {
        const exp = statement(strings, ...values);
        if (!type.check(exp)) {
            throw new Error(`Code must define a single ${type} at the top level`);
        }
        return exp;
    };
}
exports.typedStatement = typedStatement;
function expression(strings, ...values) {
    const stat = statement(strings, ...values);
    if (!ast_types_1.namedTypes.ExpressionStatement.check(stat)) {
        throw new Error("Code must define a single statement expression at the top level");
    }
    return stat.expression;
}
exports.expression = expression;
function statement(strings, ...values) {
    const code = codeTemplate(strings, ...values);
    const file = partialParse(code);
    if (file.program.body.length !== 1) {
        throw new Error("Code must have exactly one statement");
    }
    const [firstStatement] = file.program.body;
    return firstStatement;
}
exports.statement = statement;
function codeTemplate(strings, ...values) {
    return strings
        .flatMap((string, i) => {
        const value = values[i];
        if (typeof value === "string")
            return [string, value];
        return [
            string,
            Array.isArray(value)
                ? value.map((item) => recast.print(item).code).join("")
                : recast.print(value).code,
        ];
    })
        .join("");
}
function findFirstDecoratorByName(node, decoratorName) {
    let decorator = null;
    recast.visit(node, {
        visitDecorator(path) {
            const callee = path.get("expression", "callee");
            if (callee.value && callee.value.name === decoratorName) {
                decorator = path.value;
                return false;
            }
            return this.traverse(path);
        },
        // Recast has a bug of traversing class decorators
        // This method fixes it
        visitClassDeclaration(path) {
            const childPath = path.get("decorators");
            if (childPath.value) {
                this.traverse(childPath);
            }
            return this.traverse(path);
        },
        // Recast has a bug of traversing class property decorators
        // This method fixes it
        visitClassProperty(path) {
            const childPath = path.get("decorators");
            if (childPath.value) {
                this.traverse(childPath);
            }
            this.traverse(path);
        },
    });
    if (!decorator) {
        throw new Error(`Could not find class decorator with the name ${decoratorName} in provided AST node`);
    }
    return decorator;
}
exports.findFirstDecoratorByName = findFirstDecoratorByName;
function createGenericArray(itemType) {
    return ast_types_1.builders.tsTypeReference(ARRAY_ID, ast_types_1.builders.tsTypeParameterInstantiation([itemType]));
}
exports.createGenericArray = createGenericArray;
function pushIdentifierToModuleSection(file, section, identifier) {
    const moduleDecorator = findFirstDecoratorByName(file, "Module");
    //Add imported name to provider
    recast.visit(moduleDecorator, {
        visitCallExpression(path) {
            // @ts-ignore
            if (path.node.callee.name === "Module") {
                const args = path.get("arguments");
                const firstModuleArg = args.value[0];
                // @ts-ignore
                const providers = firstModuleArg.properties.find((node) => node.key.name === section);
                // @ts-ignore
                providers.value.elements.push(identifier);
            }
            this.traverse(path);
        },
    });
}
exports.pushIdentifierToModuleSection = pushIdentifierToModuleSection;
