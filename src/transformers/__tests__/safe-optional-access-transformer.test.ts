import { SafeOptionalAccessTransformer } from '../safe-optional-access-transformer';

describe('SafeOptionalAccessTransformer', () => {
    let transformer: SafeOptionalAccessTransformer;

    beforeEach(() => {
        transformer = new SafeOptionalAccessTransformer();
    });

    it('should convert unsafe property access to optional chaining', () => {
        const input = `
interface Stuff {
    a: number;
    b?: number[]
}

let stuff: Stuff = {a: 10, b: undefined };
stuff.b.sort();`;

        const result = transformer.transform(input);
        
        expect(result).toContain('stuff.b?.sort');
        expect(result).not.toContain('b: undefined');
    });

    it('should remove undefined assignments from object literals', () => {
        const input = `
let obj = {a: 10, b: undefined, c: 'test'};`;

        const result = transformer.transform(input);
        
        expect(result).toContain('a: 10');
        expect(result).toContain('c: \'test\'');
        expect(result).not.toContain('b: undefined');
    });

    it('should handle nested property access chains', () => {
        const input = `
obj.optional.method();
obj.required.value;`;

        const result = transformer.transform(input);
        
        expect(result).toContain('obj.optional?.method');
        expect(result).toContain('obj.required.value');
    });

    it('should handle multiple optional accesses in same code', () => {
        const input = `
data.items.forEach();
config.settings.apply();`;

        const result = transformer.transform(input);
        
        expect(result).toContain('data.items?.forEach');
        expect(result).toContain('config.settings?.apply');
    });

        it('should use optional call for methods on optional arrays', () => {
                const input = `// Example TypeScript code
interface User {
    name: string;
    ages?: number[];
}

function greetUser(user: User) {
    console.log('Hello, ' + user.name);
    return user.ages.map(a => a > 18);
}`;

                const result = transformer.transform(input);

                expect(result).toContain("return user.ages?.map(a => a > 18);");
        });

    it('should not modify already safe code', () => {
        const input = `
let obj = {a: 10, b: 20};
obj?.prop?.method();`;

        const result = transformer.transform(input);
        
        expect(result).toContain('obj?.prop?.method()');
    });

    it('should handle empty code', () => {
        const input = '';
        const result = transformer.transform(input);
        expect(result).toBe('');
    });

    it('should preserve non-undefined object literal values', () => {
        const input = `
let obj = {
    a: 10,
    b: 'hello',
    c: null,
    d: undefined,
    e: false
};`;

        const result = transformer.transform(input);
        
        expect(result).toContain('a: 10');
        expect(result).toContain('b: \'hello\'');
        expect(result).toContain('c: null');
        expect(result).not.toContain('d: undefined');
        expect(result).toContain('e: false');
    });
});
