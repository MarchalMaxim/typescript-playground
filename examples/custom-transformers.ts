/**
 * Example: Adding a Custom Transformation
 * 
 * This file demonstrates how to add your own custom AST transformation
 * to the TypeScript playground.
 * 
 * Steps to add a new transformation:
 * 1. Create a new transformer class in src/ast-analyzer.ts
 * 2. Implement the transform method using TypeScript Compiler API
 * 3. Register it in ASTAnalyzer.transform()
 * 4. Add the option to the HTML dropdown
 */

import * as ts from 'typescript';

/**
 * Example: Convert var to const/let
 * This transformer converts old 'var' declarations to 'const' or 'let'
 */
export class VarToConstTransformer {
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
                    // Check if this is a variable statement with 'var'
                    if (ts.isVariableStatement(node)) {
                        const declarationList = node.declarationList;
                        
                        // If it uses 'var', convert to 'const'
                        if (declarationList.flags & ts.NodeFlags.Let) {
                            // Already let, skip
                            return ts.visitEachChild(node, visit, context);
                        } else if (declarationList.flags & ts.NodeFlags.Const) {
                            // Already const, skip
                            return ts.visitEachChild(node, visit, context);
                        } else {
                            // Convert var to const
                            const newDeclarationList = ts.factory.updateVariableDeclarationList(
                                declarationList,
                                declarationList.declarations
                            );
                            
                            const newNode = ts.factory.updateVariableStatement(
                                node,
                                node.modifiers,
                                ts.factory.createVariableDeclarationList(
                                    newDeclarationList.declarations,
                                    ts.NodeFlags.Const
                                )
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
 * Example: Add JSDoc Comments
 * This transformer adds placeholder JSDoc comments to functions
 */
export class AddJSDocTransformer {
    static transform(sourceCode: string): string {
        // Note: This is a simplified example
        // A real implementation would use the TypeScript Compiler API
        // to properly add JSDoc comment nodes
        
        const lines = sourceCode.split('\n');
        const result: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Simple pattern matching for function declarations
            if (line.trim().startsWith('function ') && i > 0 && !lines[i - 1].trim().startsWith('*')) {
                // Add JSDoc comment
                const indent = line.match(/^\s*/)?.[0] || '';
                result.push(`${indent}/**`);
                result.push(`${indent} * TODO: Add function description`);
                result.push(`${indent} */`);
            }
            
            result.push(line);
        }
        
        return result.join('\n');
    }
}

/**
 * Example: Extract Magic Numbers to Constants
 * This transformer identifies numeric literals and suggests extracting them
 */
export class ExtractMagicNumbersTransformer {
    static transform(sourceCode: string): string {
        const sourceFile = ts.createSourceFile(
            'temp.ts',
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

        const magicNumbers: Array<{ value: string; line: number }> = [];

        function visit(node: ts.Node) {
            // Find numeric literals that aren't 0, 1, -1 (common non-magic numbers)
            if (ts.isNumericLiteral(node)) {
                const value = parseFloat(node.text);
                if (value !== 0 && value !== 1 && value !== -1) {
                    const { line } = sourceFile.getLineAndCharacterOfPosition(node.pos);
                    magicNumbers.push({ value: node.text, line: line + 1 });
                }
            }

            ts.forEachChild(node, visit);
        }

        visit(sourceFile);

        if (magicNumbers.length === 0) {
            return sourceCode + '\n\n// No magic numbers found';
        }

        let result = '// Magic numbers found at:\n';
        magicNumbers.forEach(({ value, line }) => {
            result += `// Line ${line}: ${value}\n`;
        });
        result += '\n// Consider extracting these to named constants\n\n';
        result += sourceCode;

        return result;
    }
}

// To use these transformers:
// 1. Copy the transformer class to src/ast-analyzer.ts
// 2. Add a case in ASTAnalyzer.transform():
//    case 'var-to-const':
//        return VarToConstTransformer.transform(sourceCode);
// 3. Add to HTML dropdown:
//    <option value="var-to-const">Convert var to const</option>
