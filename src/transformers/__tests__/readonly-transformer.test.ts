import { ReadonlyTransformer } from '../readonly-transformer';

describe('ReadonlyTransformer', () => {
    let transformer: ReadonlyTransformer;

    beforeEach(() => {
        transformer = new ReadonlyTransformer();
    });

    it('should add readonly modifier to interface properties', () => {
        const input = `
interface User {
    name: string;
    age: number;
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('readonly name: string');
        expect(result).toContain('readonly age: number');
    });

    it('should not add readonly if already present', () => {
        const input = `
interface User {
    readonly name: string;
    age: number;
}`;

        const result = transformer.transform(input);
        
        // Should have readonly only once for name
        expect(result.match(/readonly name/g)?.length).toBe(1);
        expect(result).toContain('readonly age: number');
    });

    it('should handle optional properties', () => {
        const input = `
interface Config {
    host: string;
    port?: number;
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('readonly host: string');
        expect(result).toContain('readonly port?: number');
    });

    it('should handle empty interface', () => {
        const input = `
interface Empty {
}`;

        const result = transformer.transform(input);
        expect(result).toContain('interface Empty');
    });

    it('should handle multiple interfaces', () => {
        const input = `
interface A {
    x: number;
}

interface B {
    y: string;
}`;

        const result = transformer.transform(input);
        
        expect(result).toContain('readonly x: number');
        expect(result).toContain('readonly y: string');
    });

    it('should handle empty code', () => {
        const input = '';
        const result = transformer.transform(input);
        expect(result).toBe('');
    });
});
