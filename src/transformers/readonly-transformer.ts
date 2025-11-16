import * as ts from 'typescript';
import { BaseTransformer } from './base-transformer';

/**
 * Transformer for converting interface properties to readonly
 * Adds readonly modifier to all interface property signatures
 */
export class ReadonlyTransformer extends BaseTransformer {
    transform(sourceCode: string): string {
        const sourceFile = this.createSourceFile(sourceCode);
        
        const transformerFactory = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                const visit = (node: ts.Node): ts.Node => {
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
                };

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        return this.applyTransformer(sourceFile, transformerFactory);
    }
}
