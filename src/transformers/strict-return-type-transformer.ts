import * as ts from 'typescript';
import { BaseTransformer } from './base-transformer';

/**
 * Transformer for adding explicit return types to functions
 * Adds 'unknown' return type to functions that don't have one
 */
export class StrictReturnTypeTransformer extends BaseTransformer {
    transform(sourceCode: string): string {
        const sourceFile = this.createSourceFile(sourceCode);
        
        const transformerFactory = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                const visit = (node: ts.Node): ts.Node => {
                    // Add return type to functions without one
                    if (ts.isFunctionDeclaration(node) && !node.type) {
                        const newNode = ts.factory.updateFunctionDeclaration(
                            node,
                            node.modifiers,
                            node.asteriskToken,
                            node.name,
                            node.typeParameters,
                            node.parameters,
                            ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
                            node.body
                        );
                        return ts.visitEachChild(newNode, visit, context);
                    }

                    return ts.visitEachChild(node, visit, context);
                };

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        return this.applyTransformer(sourceFile, transformerFactory);
    }
}
