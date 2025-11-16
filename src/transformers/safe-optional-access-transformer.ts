import * as ts from 'typescript';
import { BaseTransformer } from './base-transformer';

/**
 * Transformer for fixing unsafe optional property access
 * Converts unsafe property access on optional properties to optional chaining
 * Also removes unnecessary undefined assignments from object literals
 */
export class SafeOptionalAccessTransformer extends BaseTransformer {
    transform(sourceCode: string): string {
        const sourceFile = this.createSourceFile(sourceCode);
        
        const transformerFactory = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                const visit = (node: ts.Node): ts.Node => {
                    // Handle element access on optional properties: a.c[0] -> a.c?.[0]
                    if (ts.isElementAccessExpression(node)) {
                        const expr = node.expression;
                        
                        // Check if accessing element on a property
                        if (ts.isPropertyAccessExpression(expr)) {
                            // Create optional chaining for element access
                            const newNode = ts.factory.createElementAccessChain(
                                expr,
                                ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                                node.argumentExpression
                            );
                            return ts.visitEachChild(newNode, visit, context);
                        }
                    }
                    
                    // Convert call expressions on property access chains
                    // Look for: obj.prop.method() -> obj.prop?.method()
                    if (ts.isCallExpression(node)) {
                        const expr = node.expression;

                        if (ts.isPropertyAccessExpression(expr)) {
                            const innerExpr = expr.expression;

                            // Check if we're calling a method on a property access
                            // Pattern: stuff.b.sort() -> stuff.b?.sort()
                            if (ts.isPropertyAccessExpression(innerExpr)) {
                                // Create optional chaining on the call expression itself
                                // so that we get: innerExpr?.method(args)
                                const optionalCallee = ts.factory.createPropertyAccessChain(
                                    innerExpr,
                                    ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                                    expr.name
                                );

                                const newNode = ts.factory.createCallChain(
                                    optionalCallee,
                                    undefined, // questionDotToken is already on the callee chain
                                    node.typeArguments,
                                    node.arguments
                                );

                                return ts.visitEachChild(newNode, visit, context);
                            }
                            
                            // Handle direct function calls on properties: config.validate() -> config.validate?.()
                            // Only if the property is being called directly (not nested)
                            if (ts.isIdentifier(innerExpr)) {
                                // Create optional call chain without adding optional to the identifier
                                const newNode = ts.factory.createCallChain(
                                    expr,
                                    ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                                    node.typeArguments,
                                    node.arguments
                                );

                                return ts.visitEachChild(newNode, visit, context);
                            }
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
                                newProperties
                            );
                            return ts.visitEachChild(newNode, visit, context);
                        }
                    }

                    return ts.visitEachChild(node, visit, context);
                };

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        return this.applyTransformer(sourceFile, transformerFactory);
    }
}
