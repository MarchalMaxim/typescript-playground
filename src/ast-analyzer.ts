import * as ts from 'typescript';
import {
    StrictReturnTypeTransformer,
    ExplicitAnyTransformer,
    ReadonlyTransformer,
    SafeOptionalAccessTransformer
} from './transformers';

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
                    return new StrictReturnTypeTransformer().transform(sourceCode);
                case 'explicit-any':
                    return new ExplicitAnyTransformer().transform(sourceCode);
                case 'const-to-readonly':
                    return new ReadonlyTransformer().transform(sourceCode);
                case 'safe-optional-access':
                    return new SafeOptionalAccessTransformer().transform(sourceCode);
                default:
                    return sourceCode;
            }
        } catch (error) {
            return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
}
