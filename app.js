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

// Initialize editor
const editor = document.getElementById('editor');
editor.value = defaultCode;

// Run button click handler
document.getElementById('runBtn').addEventListener('click', () => {
    const code = editor.value;
    const outputDiv = document.getElementById('output');
    const compiledDiv = document.getElementById('compiled');
    
    // Clear previous output
    outputDiv.innerHTML = '';
    compiledDiv.innerHTML = '';

    try {
        // Compile TypeScript to JavaScript
        const result = ts.transpileModule(code, {
            compilerOptions: {
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.ESNext,
                lib: ['ES2020', 'DOM'],
                strict: true,
                esModuleInterop: true
            }
        });

        const jsCode = result.outputText;
        
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
            
            // Show success message if no output
            if (outputDiv.innerHTML === '') {
                addOutput('✓ Code executed successfully (no console output)', 'info');
            }
        } catch (execError) {
            // Restore console
            Object.assign(console, originalConsole);
            addOutput(`Runtime Error: ${execError.message}`, 'error');
        }

        // Check for diagnostics
        if (result.diagnostics && result.diagnostics.length > 0) {
            result.diagnostics.forEach(diagnostic => {
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                addOutput(`TypeScript Error: ${message}`, 'error');
            });
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

// Handle tab key in textarea
editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;
        
        // Insert 4 spaces
        editor.value = value.substring(0, start) + '    ' + value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
    }
});
