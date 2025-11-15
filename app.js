// Monaco Editor configuration
require.config({ 
    paths: { 
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' 
    } 
});

let editor;
let ts;

// Default TypeScript code
const defaultCode = `// Welcome to TypeScript Playground!
// Write your TypeScript code here and click "Run Code" to see the output

interface Person {
    name: string;
    age: number;
}

function greet(person: Person): string {
    return \`Hello, \${person.name}! You are \${person.age} years old.\`;
}

const user: Person = {
    name: "TypeScript Developer",
    age: 25
};

console.log(greet(user));

// Try some TypeScript features
const numbers: number[] = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);

// Type checking example
// Uncomment the line below to see TypeScript's type checking in action:
// const invalid: string = 123; // This will show an error!
`;

// Initialize Monaco Editor
require(['vs/editor/editor.main'], function() {
    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        lib: ['ES2020', 'DOM'],
        allowNonTsExtensions: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs
    });

    // Create the editor
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: defaultCode,
        language: 'typescript',
        theme: 'vs-dark',
        fontSize: 14,
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: true,
        renderWhitespace: 'selection'
    });

    // Store reference to TypeScript
    ts = monaco.languages.typescript;
});

// Run button click handler
document.getElementById('runBtn').addEventListener('click', async () => {
    if (!editor) {
        addOutput('Editor not initialized yet. Please wait...', 'error');
        return;
    }

    const code = editor.getValue();
    const outputDiv = document.getElementById('output');
    const compiledDiv = document.getElementById('compiled');
    
    // Clear previous output
    outputDiv.innerHTML = '';
    compiledDiv.innerHTML = '';

    try {
        // Get TypeScript worker to compile the code
        const model = editor.getModel();
        const worker = await monaco.languages.typescript.getTypeScriptWorker();
        const client = await worker(model.uri);
        
        // Get compiled JavaScript output
        const result = await client.getEmitOutput(model.uri.toString());
        
        if (result.outputFiles && result.outputFiles.length > 0) {
            const jsCode = result.outputFiles[0].text;
            
            // Display compiled JavaScript
            compiledDiv.textContent = jsCode;
            
            // Capture console output
            const originalConsole = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                info: console.info
            };

            // Override console methods
            console.log = (...args) => {
                addOutput(args.map(arg => formatValue(arg)).join(' '), 'log');
                originalConsole.log(...args);
            };

            console.error = (...args) => {
                addOutput(args.map(arg => formatValue(arg)).join(' '), 'error');
                originalConsole.error(...args);
            };

            console.warn = (...args) => {
                addOutput(args.map(arg => formatValue(arg)).join(' '), 'warn');
                originalConsole.warn(...args);
            };

            console.info = (...args) => {
                addOutput(args.map(arg => formatValue(arg)).join(' '), 'info');
                originalConsole.info(...args);
            };

            try {
                // Execute the compiled JavaScript
                eval(jsCode);
                
                // Restore console
                Object.assign(console, originalConsole);
            } catch (execError) {
                // Restore console
                Object.assign(console, originalConsole);
                addOutput(`Runtime Error: ${execError.message}`, 'error');
            }
        } else {
            // Check for compilation errors
            const markers = await monaco.editor.getModelMarkers({ resource: model.uri });
            if (markers.length > 0) {
                markers.forEach(marker => {
                    addOutput(
                        `Line ${marker.startLineNumber}: ${marker.message}`,
                        'error'
                    );
                });
            } else {
                addOutput('No output generated', 'info');
            }
        }
    } catch (error) {
        addOutput(`Compilation Error: ${error.message}`, 'error');
    }
});

// Clear button click handler
document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('output').innerHTML = '';
});

// Helper function to add output
function addOutput(text, type = 'log') {
    const outputDiv = document.getElementById('output');
    const line = document.createElement('div');
    line.className = `output-line output-${type}`;
    line.textContent = text;
    outputDiv.appendChild(line);
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

// Helper function to format values
function formatValue(value) {
    if (typeof value === 'object' && value !== null) {
        try {
            return JSON.stringify(value, null, 2);
        } catch (e) {
            return String(value);
        }
    }
    return String(value);
}

// Keyboard shortcut: Ctrl/Cmd + Enter to run
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('runBtn').click();
    }
});
