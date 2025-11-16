import { ASTAnalyzer } from './ast-analyzer';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';

/**
 * Main application logic for the TypeScript playground
 */
class PlaygroundApp {
    private editorView!: EditorView;
    private outputView!: EditorView;
    private astOutputElement: HTMLPreElement;
    private transformBtn: HTMLButtonElement;
    private clearBtn: HTMLButtonElement;
    private transformSelect: HTMLSelectElement;

    // Example code snippets for each transformer
    private readonly exampleCodeMap: Record<string, string> = {
        'show-ast': `// Example TypeScript code
interface User {
  name: string;
  age: number;
}

function greetUser(user: User) {
  console.log('Hello, ' + user.name);
  return user.age > 18;
}`,
        'add-strict-types': `// Functions without return types
function greetUser(user: string) {
    console.log('Hello, ' + user);
    return true;
}

function calculateSum(a: number, b: number) {
    return a + b;
}`,
        'explicit-any': `// Parameters without type annotations
function process(data) {
    return data.value;
}

function combine(a, b: number, c) {
    return a + b + c;
}

const transform = (input) => {
    return input.toUpperCase();
};`,
        'const-to-readonly': `// Interface properties without readonly
interface User {
    name: string;
    age: number;
    email?: string;
}

interface Config {
    host: string;
    port?: number;
    timeout: number;
}`,
        'safe-optional-access': `// Unsafe optional property access
interface Data {
    items?: string[];
    validate?: () => boolean;
}

const data: Data = {};
data.items.forEach(item => console.log(item));
data.validate();
const first = data.items[0];

interface User {
    profile?: {
        settings?: {
            theme: string;
        }
    }
}

const user: User = {};
const theme = user.profile.settings.theme;`
    };

    constructor() {
        // Get DOM elements
        const inputContainer = document.getElementById('input-code') as HTMLTextAreaElement;
        const outputContainer = document.getElementById('output-code') as HTMLPreElement;
        this.astOutputElement = document.getElementById('ast-output') as HTMLPreElement;
        this.transformBtn = document.getElementById('transform-btn') as HTMLButtonElement;
        this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
        this.transformSelect = document.getElementById('transform-type') as HTMLSelectElement;

        // Initialize CodeMirror editors
        this.setupCodeMirror(inputContainer);
        this.setupOutputEditor(outputContainer);
        this.setupEventListeners();
        this.showWelcomeMessage();
        
        // Load initial example code based on default selection
        const initialTransformType = this.transformSelect.value;
        const initialCode = this.exampleCodeMap[initialTransformType];
        if (initialCode) {
            this.editorView.dispatch({
                changes: {
                    from: 0,
                    to: this.editorView.state.doc.length,
                    insert: initialCode
                }
            });
        }
    }

    private setupCodeMirror(container: HTMLTextAreaElement): void {
        const startDoc = container.value;
        
        // Hide the original textarea
        container.style.display = 'none';
        
        // Create CodeMirror editor with syntax highlighting
        this.editorView = new EditorView({
            state: EditorState.create({
                doc: startDoc,
                extensions: [
                    lineNumbers(),
                    highlightActiveLineGutter(),
                    highlightSpecialChars(),
                    history(),
                    drawSelection(),
                    dropCursor(),
                    EditorState.allowMultipleSelections.of(true),
                    indentOnInput(),
                    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                    bracketMatching(),
                    closeBrackets(),
                    rectangularSelection(),
                    crosshairCursor(),
                    highlightActiveLine(),
                    highlightSelectionMatches(),
                    keymap.of([
                        ...closeBracketsKeymap,
                        ...defaultKeymap,
                        ...searchKeymap,
                        ...historyKeymap
                    ]),
                    javascript({ typescript: true }),
                    oneDark,
                    EditorView.theme({
                        "&": {
                            height: "500px",
                            fontSize: "14px"
                        },
                        ".cm-scroller": {
                            overflow: "auto"
                        }
                    })
                ]
            }),
            parent: container.parentElement!
        });
    }

    private setupOutputEditor(container: HTMLPreElement): void {
        // Hide the original pre element
        container.style.display = 'none';
        
        // Create read-only CodeMirror editor for output with syntax highlighting
        this.outputView = new EditorView({
            state: EditorState.create({
                doc: 'Click "Analyze & Transform" to see the transformed code here.',
                extensions: [
                    lineNumbers(),
                    highlightSpecialChars(),
                    EditorState.readOnly.of(true),
                    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                    javascript({ typescript: true }),
                    oneDark,
                    EditorView.theme({
                        "&": {
                            height: "400px",
                            fontSize: "13px"
                        },
                        ".cm-scroller": {
                            overflow: "auto"
                        }
                    })
                ]
            }),
            parent: container.parentElement!
        });
    }

    private setupEventListeners(): void {
        this.transformBtn.addEventListener('click', () => this.handleTransform());
        this.clearBtn.addEventListener('click', () => this.handleClear());
        this.transformSelect.addEventListener('change', () => this.handleTransformTypeChange());
    }

    private handleTransformTypeChange(): void {
        const transformType = this.transformSelect.value;
        const exampleCode = this.exampleCodeMap[transformType];
        
        if (exampleCode) {
            // Load the example code into the editor
            this.editorView.dispatch({
                changes: {
                    from: 0,
                    to: this.editorView.state.doc.length,
                    insert: exampleCode
                }
            });
            
            // Clear the output panels
            this.outputView.dispatch({
                changes: {
                    from: 0,
                    to: this.outputView.state.doc.length,
                    insert: 'Click "Analyze & Transform" to see the transformed code here.'
                }
            });
            this.astOutputElement.textContent = 'The AST structure will appear here after analysis.';
        }
    }

    private showWelcomeMessage(): void {
        this.outputView.dispatch({
            changes: {
                from: 0,
                to: this.outputView.state.doc.length,
                insert: 'Click "Analyze & Transform" to see the transformed code here.'
            }
        });
        this.astOutputElement.textContent = 'The AST structure will appear here after analysis.';
    }

    private handleTransform(): void {
        const sourceCode = this.editorView.state.doc.toString();
        const transformType = this.transformSelect.value;

        if (!sourceCode.trim()) {
            this.outputView.dispatch({
                changes: {
                    from: 0,
                    to: this.outputView.state.doc.length,
                    insert: 'Please enter some TypeScript code first.'
                }
            });
            this.astOutputElement.textContent = '';
            return;
        }

        try {
            // Show AST if selected
            if (transformType === 'show-ast') {
                const ast = ASTAnalyzer.analyze(sourceCode);
                this.astOutputElement.textContent = JSON.stringify(ast, null, 2);
                this.outputView.dispatch({
                    changes: {
                        from: 0,
                        to: this.outputView.state.doc.length,
                        insert: 'AST analysis complete. See AST structure below.'
                    }
                });
            } else {
                // Apply transformation
                const transformed = ASTAnalyzer.transform(sourceCode, transformType);
                this.outputView.dispatch({
                    changes: {
                        from: 0,
                        to: this.outputView.state.doc.length,
                        insert: transformed
                    }
                });

                // Also show AST
                const ast = ASTAnalyzer.analyze(sourceCode);
                this.astOutputElement.textContent = JSON.stringify(ast, null, 2);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
            this.outputView.dispatch({
                changes: {
                    from: 0,
                    to: this.outputView.state.doc.length,
                    insert: `Error: ${errorMsg}`
                }
            });
            this.astOutputElement.textContent = '';
        }
    }

    private handleClear(): void {
        this.editorView.dispatch({
            changes: {
                from: 0,
                to: this.editorView.state.doc.length,
                insert: ''
            }
        });
        this.outputView.dispatch({
            changes: {
                from: 0,
                to: this.outputView.state.doc.length,
                insert: ''
            }
        });
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
