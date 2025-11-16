import * as ts from 'typescript';

/**
 * Base interface for all transformers
 */
export interface Transformer {
    /**
     * Transform the given TypeScript source code
     * @param sourceCode The source code to transform
     * @returns The transformed source code
     */
    transform(sourceCode: string): string;
}

/**
 * Base class providing common transformation utilities
 */
export abstract class BaseTransformer implements Transformer {
    /**
     * Transform the given TypeScript source code
     * @param sourceCode The source code to transform
     * @returns The transformed source code
     */
    abstract transform(sourceCode: string): string;

    /**
     * Create a source file from source code
     */
    protected createSourceFile(sourceCode: string): ts.SourceFile {
        return ts.createSourceFile(
            'temp.ts',
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );
    }

    /**
     * Apply a transformer function to a source file
     */
    protected applyTransformer(
        sourceFile: ts.SourceFile,
        transformerFactory: ts.TransformerFactory<ts.SourceFile>
    ): string {
        const printer = ts.createPrinter();
        const result = ts.transform(sourceFile, [transformerFactory]);
        const transformedSourceFile = result.transformed[0];
        return printer.printFile(transformedSourceFile);
    }
}
