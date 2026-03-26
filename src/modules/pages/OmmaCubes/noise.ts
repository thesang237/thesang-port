function mod289(x: number): number {
    return x - Math.floor(x / 289.0) * 289.0;
}

function permute(x: number): number {
    return mod289((x * 34.0 + 1.0) * x);
}

function grad(hash: number, gx: number, gy: number, gz: number): number {
    const h = hash & 15;
    const gu = h < 8 ? gx : gy;
    const gv = h < 4 ? gy : h === 12 || h === 14 ? gx : gz;
    return ((h & 1) === 0 ? gu : -gu) + ((h & 2) === 0 ? gv : -gv);
}

export function noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const fz = z - Math.floor(z);
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const w = fz * fz * (3 - 2 * fz);

    const A = permute(X) + Y;
    const AA = permute(A) + Z;
    const AB = permute(A + 1) + Z;
    const B = permute(X + 1) + Y;
    const BA = permute(B) + Z;
    const BB = permute(B + 1) + Z;

    const p0 = grad(permute(AA), fx, fy, fz);
    const p1 = grad(permute(BA), fx - 1, fy, fz);
    const p2 = grad(permute(AB), fx, fy - 1, fz);
    const p3 = grad(permute(BB), fx - 1, fy - 1, fz);
    const p4 = grad(permute(AA + 1), fx, fy, fz - 1);
    const p5 = grad(permute(BA + 1), fx - 1, fy, fz - 1);
    const p6 = grad(permute(AB + 1), fx, fy - 1, fz - 1);
    const p7 = grad(permute(BB + 1), fx - 1, fy - 1, fz - 1);

    const x0 = p0 + u * (p1 - p0);
    const x1 = p2 + u * (p3 - p2);
    const x2 = p4 + u * (p5 - p4);
    const x3 = p6 + u * (p7 - p6);
    const y0 = x0 + v * (x1 - x0);
    const y1 = x2 + v * (x3 - x2);
    return y0 + w * (y1 - y0);
}
