# TypeScript AST Playground

A playground for investigating TypeScript AST transformations and code rewritings. This project allows you to visualize the Abstract Syntax Tree (AST) of TypeScript code and apply various transformations to make your code more strict and better typed.

## Features

- 🎯 **Interactive HTML/CSS/JS Interface** - Clean, modern web interface for code experimentation
- 🌳 **AST Visualization** - View the complete Abstract Syntax Tree of your TypeScript code
- 🔧 **AST Transformations** - Apply various transformations using TypeScript Compiler API:
  - Add strict return types to functions
  - Make implicit 'any' types explicit
  - Convert interface properties to readonly
- 📝 **Live Editing** - Write TypeScript code and see transformations in real-time
- 🎨 **Modern UI** - Beautiful gradient design with responsive layout

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MarchalMaxim/typescript-playground.git
cd typescript-playground
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the development server:
```bash
npm run dev
```

This will open the playground in your browser at `http://localhost:8080`.

## Usage

1. **Enter TypeScript Code**: Type or paste your TypeScript code in the left panel
2. **Select Transformation**: Choose a transformation type from the dropdown:
   - **Show AST**: View the Abstract Syntax Tree structure
   - **Add Strict Return Types**: Automatically add return types to functions
   - **Make 'any' Types Explicit**: Add explicit 'any' annotations where types are inferred
   - **Convert to Readonly**: Add readonly modifiers to interface properties
3. **Analyze & Transform**: Click the button to apply the transformation
4. **View Results**: See the transformed code in the output panel and the AST structure below

## Development

### Available Scripts

- `npm run build` - Build the project for production
- `npm run dev` - Build and start the development server
- `npm run watch` - Watch for changes and rebuild automatically

### Project Structure

```
typescript-playground/
├── src/
│   ├── ast-analyzer.ts    # AST transformation logic
│   └── index.ts           # Main application entry point
├── dist/                  # Build output (generated)
├── index.html            # Main HTML page
├── styles.css            # Styling
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## AST Transformations

This playground uses the TypeScript Compiler API to traverse and transform code. Here's how the transformations work:

### AST Visitor Pattern

The `ASTVisitor` class provides utilities for traversing the AST:
- Visit all nodes in the tree
- Convert AST to JSON for visualization
- Apply custom transformations

### Example Transformations

#### Add Strict Return Types
Transforms functions without return types to have explicit `unknown` return types:
```typescript
// Before
function greet(name: string) {
  return `Hello, ${name}`;
}

// After
function greet(name: string): unknown {
  return `Hello, ${name}`;
}
```

#### Make 'any' Explicit
Adds explicit `any` type annotations to untyped parameters:
```typescript
// Before
function process(data) {
  return data.value;
}

// After
function process(data: any) {
  return data.value;
}
```

#### Convert to Readonly
Adds `readonly` modifiers to interface properties:
```typescript
// Before
interface User {
  name: string;
  age: number;
}

// After
interface User {
  readonly name: string;
  readonly age: number;
}
```

## Extending the Playground

To add your own transformations:

1. Create a new transformer class in `src/ast-analyzer.ts`
2. Implement the transformation logic using the TypeScript Compiler API
3. Add the transformer to the `ASTAnalyzer.transform()` method
4. Update the HTML select element with the new option

Example transformer structure:
```typescript
export class MyCustomTransformer {
    static transform(sourceCode: string): string {
        const sourceFile = ts.createSourceFile('temp.ts', sourceCode, ts.ScriptTarget.Latest, true);
        const printer = ts.createPrinter();
        
        const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                function visit(node: ts.Node): ts.Node {
                    // Your transformation logic here
                    return ts.visitEachChild(node, visit, context);
                }
                return ts.visitNode(rootNode, visit) as T;
            };
        };

        const result = ts.transform(sourceFile, [transformer]);
        return printer.printFile(result.transformed[0] as ts.SourceFile);
    }
}
```

## Technologies Used

- **TypeScript** - Type-safe code transformation
- **TypeScript Compiler API** - AST parsing and transformation
- **esbuild** - Fast bundling and compilation
- **live-server** - Development server with live reload
- **HTML/CSS** - Modern, responsive UI

## Resources

- [TypeScript Compiler API Documentation](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [AST Explorer](https://astexplorer.net/) - Online tool for exploring ASTs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## License

ISC

## Contributing

Feel free to open issues or submit pull requests to improve the playground!
