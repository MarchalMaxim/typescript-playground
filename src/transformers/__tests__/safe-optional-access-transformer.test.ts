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

    it('should NOT add optional chaining when property is required', () => {
        const input = `
interface Data {
    items: string[];
}

const data: Data = { items: [] };
data.items.forEach(item => console.log(item));`;

        const result = transformer.transform(input);
        
        // Should NOT add optional chaining because items is required
        expect(result).toContain('data.items.forEach');
        expect(result).not.toContain('data.items?.forEach');
        // console.log should definitely not be optional
        expect(result).not.toContain('console.log?.');
    });

    it('should add optional chaining when property is optional', () => {
        const input = `
interface Data {
    items?: string[];
}

const data: Data = {};
data.items.forEach(item => console.log(item));`;

        const result = transformer.transform(input);
        
        // Should add optional chaining because items is optional
        expect(result).toContain('data.items?.forEach');
        // console.log should NOT be optional because it's not nullable
        expect(result).not.toContain('console.log?.');
    });

    it('should use optional call for methods on optional arrays', () => {
        const input = `
interface User {
    name: string;
    ages?: number[];
}

function greetUser(user: User) {
    console.log('Hello, ' + user.name);
    return user.ages.map(a => a > 18);
}`;

        const result = transformer.transform(input);

        // Should add optional chaining to ages property access
        expect(result).toContain("user.ages?.map");
        // Should NOT have console.log be optional
        expect(result).not.toContain('console.log?.');
    });

    it('should not modify already safe code', () => {
        const input = `
interface Obj {
    a: number;
    b: number;
}
let obj: Obj = {a: 10, b: 20};
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

    it('should handle function calls on optional properties (a.b() where b is optional)', () => {
        const input = `
interface Config {
    validate?: () => boolean;
}

const config: Config = {};
config.validate();`;

        const result = transformer.transform(input);
        
        expect(result).toContain('config.validate?.()');
    });

    it('should handle array element access on optional properties (a.c[0] where c is optional)', () => {
        const input = `
interface Data {
    items?: string[];
}

const data: Data = {};
const first = data.items[0];`;

        const result = transformer.transform(input);
        
        expect(result).toContain('data.items?.[0]');
    });

    it('should handle chained optional array access', () => {
        const input = `
interface Nested {
    values?: number[][];
}

const nested: Nested = {};
const val = nested.values[0][1];`;

        const result = transformer.transform(input);
        
        // After transformation, the first access should be optional
        // The second [1] access is safe if the first access returns a value
        expect(result).toContain('nested.values?.[0]');
    });

    it('should handle nested optional property access chains', () => {
        const input = `
interface User {
    profile?: {
        settings?: {
            theme: string;
        }
    }
}

const user: User = {};
const theme = user.profile.settings.theme;`;

        const result = transformer.transform(input);
        
        // After transformation, both profile and settings should have optional chaining
        expect(result).toContain('user.profile?.settings?.theme');
    });

    it('should handle properties that can be null', () => {
        const input = `
interface Data {
    value: string | null;
}

const data: Data = { value: null };
const upper = data.value.toUpperCase();`;

        const result = transformer.transform(input);
        
        // Should add optional chaining to value property access
        expect(result).toContain('data.value?.toUpperCase');
    });

    it('should NOT transform non-nullable standard library calls', () => {
        const input = `
const arr = [1, 2, 3];
const result = arr.map(x => x * 2);
console.log(result);`;

        const result = transformer.transform(input);
        
        // Should not add optional chaining to standard array methods
        expect(result).toContain('arr.map');
        expect(result).not.toContain('arr.map?.');
        expect(result).not.toContain('console.log?.');
    });
});
