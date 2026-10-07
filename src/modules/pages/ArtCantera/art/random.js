/**
 * Cantera uses two kinds of dice. Do not replace one with the other: their order
 * is part of the artwork's identity. Neither uses Math.random().
 */
export const DEFAULT_HASH = '0xa313d17667adeec2cb2d6f2ec328af6e1db15588c007cbd95bca700bcf1e317f';
export const isHash = (value) => /^0x[0-9a-f]{64}$/i.test(value);

export function randomHash() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return '0x' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function sfc32(hex) {
    let a = parseInt(hex.slice(0, 8), 16);
    let b = parseInt(hex.slice(8, 16), 16);
    let c = parseInt(hex.slice(16, 24), 16);
    let d = parseInt(hex.slice(24, 32), 16);
    return () => {
        a |= 0;
        b |= 0;
        c |= 0;
        d |= 0;
        const value = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + value) | 0;
        return (value >>> 0) / 4294967296;
    };
}

/** Alternates the two halves of a token hash; warms up both streams as in the original. */
export class TokenRandom {
    constructor(hash) {
        if (!isHash(hash)) throw new Error('Use a 0x prefix followed by 64 hexadecimal digits.');
        this.useA = false;
        this.a = sfc32(hash.slice(2, 34));
        this.b = sfc32(hash.slice(34, 66));
        for (let i = 0; i < 1000000; i += 2) {
            this.a();
            this.b();
        }
    }
    next() {
        this.useA = !this.useA;
        return this.useA ? this.a() : this.b();
    }
}

/** Alea's seed mixer. Calls deliberately share one evolving mixer state. */
function mash() {
    let state = 4022871197;
    return (seed) => {
        const text = String(seed);
        for (let i = 0; i < text.length; i++) {
            let value = 0.02519603282416938 * (state += text.charCodeAt(i));
            value -= state = value >>> 0;
            value *= state;
            value -= state = value >>> 0;
            state += 4294967296 * value;
        }
        return (state >>> 0) * 2.3283064365386963e-10;
    };
}

/** Local Alea stream: erosion, individual blocks, flocks and render passes get their own dice. */
export class LocalRandom {
    constructor(seed) {
        const mix = mash();
        this.carry = 1;
        this.s0 = mix(' ');
        this.s1 = mix(' ');
        this.s2 = mix(' ');
        this.s0 -= mix(seed);
        if (this.s0 < 0) this.s0 += 1;
        this.s1 -= mix(seed);
        if (this.s1 < 0) this.s1 += 1;
        this.s2 -= mix(seed);
        if (this.s2 < 0) this.s2 += 1;
    }
    quick() {
        const value = 2091639 * this.s0 + 2.3283064365386963e-10 * this.carry;
        this.s0 = this.s1;
        this.s1 = this.s2;
        this.carry = value | 0;
        this.s2 = value - this.carry;
        return this.s2;
    }
    next() {
        return this.quick() + 1.1102230246251565e-16 * ((2097152 * this.quick()) | 0);
    }
}
