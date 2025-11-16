import * as ts from 'typescript';
import { BaseTransformer } from './base-transformer';

/**
 * Transformer for fixing unsafe optional property access
 * Uses TypeScript's type checker to identify properties that can be null/undefined
 * and converts their access to optional chaining
 */
export class SafeOptionalAccessTransformer extends BaseTransformer {
    transform(sourceCode: string): string {
        // Create a program with type checking enabled
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.Latest,
            module: ts.ModuleKind.ESNext,
            strict: true,
            strictNullChecks: true, // Enable strict null checks to detect optional types
            lib: ['lib.es2015.d.ts'],
        };

        const sourceFile = ts.createSourceFile(
            'temp.ts',
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

        // Create a minimal compiler host
        const host: ts.CompilerHost = {
            getSourceFile: (fileName) => {
                if (fileName === 'temp.ts') {
                    return sourceFile;
                }
                // Return undefined for lib files - type checker will use built-in types
                return undefined;
            },
            writeFile: () => {},
            getCurrentDirectory: () => '',
            getDirectories: () => [],
            fileExists: (fileName) => fileName === 'temp.ts',
            readFile: (fileName) => fileName === 'temp.ts' ? sourceCode : undefined,
            getCanonicalFileName: (fileName) => fileName,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => '\n',
            getDefaultLibFileName: (options) => ts.getDefaultLibFileName(options),
        };

        const program = ts.createProgram(['temp.ts'], compilerOptions, host);
        const typeChecker = program.getTypeChecker();

        const transformerFactory = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                const visit = (node: ts.Node): ts.Node => {
                    // Handle call expressions FIRST: obj.method()
                    if (ts.isCallExpression(node)) {
                        const expr = node.expression;

                        if (ts.isPropertyAccessExpression(expr)) {
                            const innerExpr = expr.expression;
                            
                            // Check if the method itself (expr) is nullable (optional function)
                            if (isNullableType(expr, typeChecker)) {
                                // The function property is optional, use optional call
                                const newNode = ts.factory.createCallChain(
                                    expr, // Don't visit expr, handle it as-is
                                    ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                                    node.typeArguments,
                                    node.arguments.map(arg => ts.visitNode(arg, visit) as ts.Expression)
                                );
                                return newNode;
                            }
                            
                            // Check if the property being accessed (not called) is nullable
                            // e.g., user.ages.map() where ages is optional
                            if (isNullableType(innerExpr, typeChecker)) {
                                // The object being accessed is nullable, make the whole call chain optional
                                const visitedInnerExpr = ts.visitNode(innerExpr, visit) as ts.Expression;
                                const optionalAccess = ts.factory.createPropertyAccessChain(
                                    visitedInnerExpr,
                                    ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                                    expr.name
                                );
                                
                                // Create the call with the optional access (not optional call)
                                const newNode = ts.factory.updateCallExpression(
                                    node,
                                    optionalAccess,
                                    node.typeArguments,
                                    node.arguments.map(arg => ts.visitNode(arg, visit) as ts.Expression)
                                );
                                return newNode;
                            }
                        }
                        
                        // Visit children normally if we didn't transform
                        return ts.visitEachChild(node, visit, context);
                    }

                    // Handle property access expressions: obj.prop
                    if (ts.isPropertyAccessExpression(node)) {
                        // Check if this is part of a call expression - if so, let the call expression handler deal with it
                        const parent = node.parent;
                        if (parent && ts.isCallExpression(parent) && parent.expression === node) {
                            // This property access is the callee of a call expression, don't transform it here
                            return ts.visitEachChild(node, visit, context);
                        }
                        
                        const expr = node.expression;
                        
                        // Check if the expression type includes undefined or null
                        if (isNullableType(expr, typeChecker)) {
                            // Convert to optional chaining
                            const newNode = ts.factory.createPropertyAccessChain(
                                ts.visitNode(expr, visit) as ts.Expression,
                                ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                                node.name
                            );
                            return newNode;
                        }
                    }

                    // Handle element access: obj[0] or obj['key']
                    if (ts.isElementAccessExpression(node)) {
                        const expr = node.expression;
                        
                        // Check if the expression type includes undefined or null
                        if (isNullableType(expr, typeChecker)) {
                            // Convert to optional element access
                            const newNode = ts.factory.createElementAccessChain(
                                ts.visitNode(expr, visit) as ts.Expression,
                                ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                                ts.visitNode(node.argumentExpression, visit) as ts.Expression
                            );
                            return newNode;
                        }
                    }

                    // Remove unnecessary undefined assignments in object literals
                    if (ts.isObjectLiteralExpression(node)) {
                        const newProperties = node.properties.filter(prop => {
                            if (ts.isPropertyAssignment(prop)) {
                                // Remove properties explicitly set to undefined
                                if (ts.isIdentifier(prop.initializer) && 
                                    prop.initializer.text === 'undefined') {
                                    return false;
                                }
                            }
                            return true;
                        });
                        
                        if (newProperties.length !== node.properties.length) {
                            const newNode = ts.factory.updateObjectLiteralExpression(
                                node,
                                newProperties.map(prop => ts.visitNode(prop, visit) as ts.ObjectLiteralElementLike)
                            );
                            return newNode;
                        }
                    }

                    return ts.visitEachChild(node, visit, context);
                };

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        const result = ts.transform(sourceFile, [transformerFactory]);
        const printer = ts.createPrinter();
        return printer.printFile(result.transformed[0] as ts.SourceFile);
    }
}

/**
 * Check if a type includes null or undefined
 */
function isNullableType(node: ts.Node, typeChecker: ts.TypeChecker): boolean {
    try {
        const type = typeChecker.getTypeAtLocation(node);
        if (!type) {
            return false;
        }

        // Helper to check if a single type is nullable
        const isTypeNullable = (t: ts.Type): boolean => {
            return (t.flags & ts.TypeFlags.Undefined) !== 0 || 
                   (t.flags & ts.TypeFlags.Null) !== 0 ||
                   (t.flags & ts.TypeFlags.Void) !== 0;
        };

        // Check if type is a union type
        if (type.isUnion()) {
            // Check if any of the union types is undefined or null
            return type.types.some(t => isTypeNullable(t));
        }

        // Check if the type itself is undefined or null
        return isTypeNullable(type);
    } catch (e) {
        // If we can't get the type, be conservative and don't transform
        return false;
    }
}
