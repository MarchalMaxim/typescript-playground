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
                    // Convert call expressions on property access chains
                    // Look for: obj.prop.method() -> obj.prop?.method()
                    if (ts.isCallExpression(node)) {
                        const expr = node.expression;
                        
                        if (ts.isPropertyAccessExpression(expr)) {
                            const innerExpr = expr.expression;
                            
                            // Check if we're calling a method on a property access
                            // Pattern: stuff.b.sort() -> stuff.b?.sort()
                            if (ts.isPropertyAccessExpression(innerExpr)) {
                                // Create optional chaining on the method call itself
                                const newExpression = ts.factory.createPropertyAccessChain(
                                    innerExpr,
                                    ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                                    expr.name
                                );
                                
                                const newNode = ts.factory.updateCallExpression(
                                    node,
                                    newExpression,
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
