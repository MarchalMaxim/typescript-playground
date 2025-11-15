import { ASTAnalyzer } from './ast-analyzer';

/**
 * Main application logic for the TypeScript playground
 */
class PlaygroundApp {
    private inputElement: HTMLTextAreaElement;
    private outputElement: HTMLPreElement;
    private astOutputElement: HTMLPreElement;
    private transformBtn: HTMLButtonElement;
    private clearBtn: HTMLButtonElement;
    private transformSelect: HTMLSelectElement;

    constructor() {
        // Get DOM elements
        this.inputElement = document.getElementById('input-code') as HTMLTextAreaElement;
        this.outputElement = document.getElementById('output-code') as HTMLPreElement;
        this.astOutputElement = document.getElementById('ast-output') as HTMLPreElement;
        this.transformBtn = document.getElementById('transform-btn') as HTMLButtonElement;
        this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
        this.transformSelect = document.getElementById('transform-type') as HTMLSelectElement;

        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    private setupEventListeners(): void {
        this.transformBtn.addEventListener('click', () => this.handleTransform());
        this.clearBtn.addEventListener('click', () => this.handleClear());
    }

    private showWelcomeMessage(): void {
        this.outputElement.textContent = 'Click "Analyze & Transform" to see the transformed code here.';
        this.astOutputElement.textContent = 'The AST structure will appear here after analysis.';
    }

    private handleTransform(): void {
        const sourceCode = this.inputElement.value;
        const transformType = this.transformSelect.value;

        if (!sourceCode.trim()) {
            this.outputElement.textContent = 'Please enter some TypeScript code first.';
            this.astOutputElement.textContent = '';
            return;
        }

        try {
            // Show AST if selected
            if (transformType === 'show-ast') {
                const ast = ASTAnalyzer.analyze(sourceCode);
                this.astOutputElement.textContent = JSON.stringify(ast, null, 2);
                this.outputElement.textContent = 'AST analysis complete. See AST structure below.';
            } else {
                // Apply transformation
                const transformed = ASTAnalyzer.transform(sourceCode, transformType);
                this.outputElement.textContent = transformed;

                // Also show AST
                const ast = ASTAnalyzer.analyze(sourceCode);
                this.astOutputElement.textContent = JSON.stringify(ast, null, 2);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
            this.outputElement.textContent = `Error: ${errorMsg}`;
            this.astOutputElement.textContent = '';
        }
    }

    private handleClear(): void {
        this.inputElement.value = '';
        this.outputElement.textContent = '';
        this.astOutputElement.textContent = '';
        this.showWelcomeMessage();
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PlaygroundApp();
    });
} else {
    new PlaygroundApp();
}
