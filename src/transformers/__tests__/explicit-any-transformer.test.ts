import { ExplicitAnyTransformer } from '../explicit-any-transformer';

describe('ExplicitAnyTransformer', () => {
    let transformer: ExplicitAnyTransformer;

    beforeEach(() => {
        transformer = new ExplicitAnyTransformer();
    });

    it('should add any type to parameter without type', () => {
        const input = `
function process(data) {
    return data.value;
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('function process(data: any)');
    });

    it('should not modify parameter that already has a type', () => {
        const input = `
function process(data: string) {
    return data.toUpperCase();
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('function process(data: string)');
        expect(result).not.toContain('any');
    });

    it('should handle multiple parameters', () => {
        const input = `
function combine(a, b: number, c) {
    return a + b + c;
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('a: any');
        expect(result).toContain('b: number');
        expect(result).toContain('c: any');
    });

    it('should handle empty code', () => {
        const input = '';
        const result = transformer.transform(input);
        expect(result).toBe('');
    });

    it('should handle code without parameters', () => {
        const input = `
function getValue() {
    return 42;
}`;

        const result = transformer.transform(input);
        expect(result).toContain('function getValue()');
        expect(result).not.toContain('any');
    });

    it('should handle arrow functions', () => {
        const input = `
const process = (data) => {
    return data.value;
};`;

        const result = transformer.transform(input);
        
        expect(result).toContain('data: any');
    });
});
