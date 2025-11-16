import { StrictReturnTypeTransformer } from '../strict-return-type-transformer';

describe('StrictReturnTypeTransformer', () => {
    let transformer: StrictReturnTypeTransformer;

    beforeEach(() => {
        transformer = new StrictReturnTypeTransformer();
    });

    it('should add unknown return type to function without return type', () => {
        const input = `
function greetUser(user: string) {
    console.log('Hello, ' + user);
    return true;
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('function greetUser(user: string): unknown');
    });

    it('should not modify function that already has a return type', () => {
        const input = `
function greetUser(user: string): boolean {
    console.log('Hello, ' + user);
    return true;
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('function greetUser(user: string): boolean');
        expect(result).not.toContain('unknown');
    });

    it('should handle multiple functions', () => {
        const input = `
function foo() {
    return 1;
}

function bar(): string {
    return 'hello';
}

function baz() {
    return false;
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('function foo(): unknown');
        expect(result).toContain('function bar(): string');
        expect(result).toContain('function baz(): unknown');
    });

    it('should handle empty code', () => {
        const input = '';
        const result = transformer.transform(input);
        expect(result).toBe('');
    });

    it('should handle code without functions', () => {
        const input = `
interface User {
    name: string;
    age: number;
}`;

        const result = transformer.transform(input);
        expect(result).toContain('interface User');
        expect(result).not.toContain('unknown');
    });
});
