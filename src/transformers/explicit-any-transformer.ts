import * as ts from 'typescript';
import { BaseTransformer } from './base-transformer';

/**
 * Transformer for making implicit 'any' types explicit
 * Adds explicit 'any' type annotations to parameters without types
 */
export class ExplicitAnyTransformer extends BaseTransformer {
    transform(sourceCode: string): string {
        const sourceFile = this.createSourceFile(sourceCode);
        
        const transformerFactory = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                const visit = (node: ts.Node): ts.Node => {
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
                };

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        return this.applyTransformer(sourceFile, transformerFactory);
    }
}
