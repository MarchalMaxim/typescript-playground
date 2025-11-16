import * as ts from 'typescript';

/**
 * AST Visitor utility for traversing and transforming TypeScript AST
 */
export class ASTVisitor {
    /**
     * Visit all nodes in the AST
     */
    static visit(node: ts.Node, callback: (node: ts.Node) => void): void {
        callback(node);
        ts.forEachChild(node, (child) => this.visit(child, callback));
    }

    /**
     * Get a formatted JSON representation of the AST
     */
    static astToJson(node: ts.Node, depth: number = 0): any {
        const obj: any = {
            kind: ts.SyntaxKind[node.kind],
            pos: node.pos,
            end: node.end,
        };

        // Add specific properties based on node type
        if (ts.isIdentifier(node)) {
            obj.text = node.text;
        } else if (ts.isStringLiteral(node)) {
            obj.text = node.text;
        } else if (ts.isNumericLiteral(node)) {
            obj.text = node.text;
        }

        // Recursively process children, but limit depth to avoid too much data
        if (depth < 10) {
            const children: any[] = [];
            ts.forEachChild(node, (child) => {
                children.push(this.astToJson(child, depth + 1));
            });
            if (children.length > 0) {
                obj.children = children;
            }
        }

        return obj;
    }
}

/**
 * Transformer for adding explicit return types to functions
 */
export class StrictReturnTypeTransformer {
    static transform(sourceCode: string): string {
        const sourceFile = ts.createSourceFile(
            'temp.ts',
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

        const printer = ts.createPrinter();
        
        const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                function visit(node: ts.Node): ts.Node {
                    // Add return type to functions without one
                    if (ts.isFunctionDeclaration(node) && !node.type) {
                        const newNode = ts.factory.updateFunctionDeclaration(
                            node,
                            node.modifiers,
                            node.asteriskToken,
                            node.name,
                            node.typeParameters,
                            node.parameters,
                            ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword), // Add 'unknown' return type
                            node.body
                        );
                        return ts.visitEachChild(newNode, visit, context);
                    }

                    return ts.visitEachChild(node, visit, context);
                }

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        const result = ts.transform(sourceFile, [transformer]);
        const transformedSourceFile = result.transformed[0] as ts.SourceFile;
        return printer.printFile(transformedSourceFile);
    }
}

/**
 * Transformer for making implicit 'any' types explicit
 */
export class ExplicitAnyTransformer {
    static transform(sourceCode: string): string {
        const sourceFile = ts.createSourceFile(
            'temp.ts',
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

        const printer = ts.createPrinter();
        
        const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                function visit(node: ts.Node): ts.Node {
                    // Add explicit 'any' type to parameters without types
                    if (ts.isParameter(node) && !node.type) {
                        const newNode = ts.factory.updateParameterDeclaration(
                            node,
                            node.modifiers,
                            node.dotDotDotToken,
                            node.name,
                            node.questionToken,
                            ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                            node.initializer
                        );
                        return ts.visitEachChild(newNode, visit, context);
                    }

                    return ts.visitEachChild(node, visit, context);
                }

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        const result = ts.transform(sourceFile, [transformer]);
        const transformedSourceFile = result.transformed[0] as ts.SourceFile;
        return printer.printFile(transformedSourceFile);
    }
}

/**
 * Transformer for converting const to readonly
 */
export class ReadonlyTransformer {
    static transform(sourceCode: string): string {
        const sourceFile = ts.createSourceFile(
            'temp.ts',
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

        const printer = ts.createPrinter();
        
        const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                function visit(node: ts.Node): ts.Node {
                    // Add readonly modifier to interface properties
                    if (ts.isPropertySignature(node)) {
                        const modifiers = node.modifiers || [];
                        const hasReadonly = modifiers.some(
                            m => m.kind === ts.SyntaxKind.ReadonlyKeyword
                        );

                        if (!hasReadonly) {
                            const newModifiers = [
                                ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword),
                                ...modifiers
                            ];
                            
                            const newNode = ts.factory.updatePropertySignature(
                                node,
                                newModifiers,
                                node.name,
                                node.questionToken,
                                node.type
                            );
                            return ts.visitEachChild(newNode, visit, context);
                        }
                    }

                    return ts.visitEachChild(node, visit, context);
                }

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        const result = ts.transform(sourceFile, [transformer]);
        const transformedSourceFile = result.transformed[0] as ts.SourceFile;
        return printer.printFile(transformedSourceFile);
    }
}

/**
 * Transformer for fixing unsafe optional property access
 * Converts unsafe property access on optional properties to optional chaining
 */
export class SafeOptionalAccessTransformer {
    static transform(sourceCode: string): string {
        const sourceFile = ts.createSourceFile(
            'temp.ts',
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

        const printer = ts.createPrinter();

        const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                function visit(node: ts.Node): ts.Node {
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
                                // stuff.b.sort() -> stuff.b?.sort()
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
                }

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        const result = ts.transform(sourceFile, [transformer]);
        const transformedSourceFile = result.transformed[0] as ts.SourceFile;
        return printer.printFile(transformedSourceFile);
    }
}

/**
 * Main AST analyzer and transformer
 */
export class ASTAnalyzer {
    /**
     * Parse source code and return AST
     */
    static analyze(sourceCode: string): any {
        try {
            const sourceFile = ts.createSourceFile(
                'temp.ts',
                sourceCode,
                ts.ScriptTarget.Latest,
                true
            );

            return ASTVisitor.astToJson(sourceFile);
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Apply transformation based on type
     */
    static transform(sourceCode: string, transformType: string): string {
        try {
            switch (transformType) {
                case 'add-strict-types':
                    return StrictReturnTypeTransformer.transform(sourceCode);
                case 'explicit-any':
                    return ExplicitAnyTransformer.transform(sourceCode);
                case 'const-to-readonly':
                    return ReadonlyTransformer.transform(sourceCode);
                case 'safe-optional-access':
                    return SafeOptionalAccessTransformer.transform(sourceCode);
                default:
                    return sourceCode;
            }
        } catch (error) {
            return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
}
