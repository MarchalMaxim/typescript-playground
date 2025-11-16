# Transformers

This directory contains modular, testable TypeScript AST transformers. Each transformer is implemented in its own file and extends the `BaseTransformer` class.

## Structure

```
transformers/
├── base-transformer.ts                  # Base interface and utilities
├── strict-return-type-transformer.ts    # Adds return types to functions
├── explicit-any-transformer.ts          # Makes implicit 'any' explicit
├── readonly-transformer.ts              # Converts properties to readonly
├── safe-optional-access-transformer.ts  # Fixes unsafe optional access
├── index.ts                             # Exports all transformers
└── __tests__/                           # Test files
    ├── strict-return-type-transformer.test.ts
    ├── explicit-any-transformer.test.ts
    ├── readonly-transformer.test.ts
    └── safe-optional-access-transformer.test.ts
```

## Creating a New Transformer

1. Create a new file in this directory (e.g., `my-transformer.ts`)
2. Extend the `BaseTransformer` class
3. Implement the `transform(sourceCode: string): string` method
4. Export the transformer in `index.ts`
5. Add it to the switch statement in `src/ast-analyzer.ts`
6. Create a corresponding test file in `__tests__/`

### Example

```typescript
import * as ts from 'typescript';
import { BaseTransformer } from './base-transformer';

export class MyTransformer extends BaseTransformer {
    transform(sourceCode: string): string {
        const sourceFile = this.createSourceFile(sourceCode);
        
        const transformerFactory = <T extends ts.Node>(context: ts.TransformationContext) => {
            return (rootNode: T) => {
                const visit = (node: ts.Node): ts.Node => {
                    // Your transformation logic here
                    return ts.visitEachChild(node, visit, context);
                };

                return ts.visitNode(rootNode, visit) as T;
            };
        };

        return this.applyTransformer(sourceFile, transformerFactory);
    }
}
```

## Testing

Each transformer should have comprehensive tests covering:
- Basic transformation cases
- Edge cases (empty code, no matches, etc.)
- Multiple occurrences
- Code that shouldn't be modified

Run tests with:
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

## Available Transformers

### StrictReturnTypeTransformer
Adds explicit `unknown` return types to functions that don't have one.

**Example:**
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

### ExplicitAnyTransformer
Adds explicit `any` type annotations to parameters without types.

**Example:**
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

### ReadonlyTransformer
Adds `readonly` modifiers to interface property signatures.

**Example:**
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

### SafeOptionalAccessTransformer
Converts unsafe property access on optional properties to optional chaining and removes unnecessary `undefined` assignments.

**Example:**
```typescript
// Before
let stuff: Stuff = {a: 10, b: undefined };
stuff.b.sort();

// After
let stuff: Stuff = { a: 10 };
(stuff.b?.sort)();
```
