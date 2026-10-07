/** Pure vector helpers shared by the source camera/tracer and teaching studies. */
export function channelHex(value) {
    let hex = Math.round(Math.min(255, Math.max(0, value))).toString(16);
    if (1 == hex.length) {
        return '0' + hex;
    } else {
        return hex;
    }
}
export function rotate2(x, y, angle) {
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);
    return [x * cos - y * sin, x * sin + y * cos];
}
export function rayPlane(planeOrigin, normal, origin, direction) {
    let denominator = dot(direction, normal);
    if (Math.abs(denominator) <= 0.0001) {
        return [0, 0, 0, false, -10];
    }
    let distance = dot([planeOrigin[0] - origin[0], planeOrigin[1] - origin[1], planeOrigin[2] - origin[2]], normal) / denominator;
    return [origin[0] + distance * direction[0], origin[1] + distance * direction[1], origin[2] + distance * direction[2], true, distance];
}
export function dot(a, b) {
    let length = Math.min(a.length, b.length);
    let sum = 0;
    for (let index = 0; index < length; index++) sum += a[index] * b[index];
    return sum;
}
export function rotateZ(x, y, z, angle) {
    let rotated = rotate2(x, y, angle);
    return [rotated[0], rotated[1], z];
}
export function rotateXZ(x, y, z, tilt, turn) {
    const rotated = rotate2(y, z, tilt);
    return rotateZ(x, rotated[0], rotated[1], turn);
}
export function addVec(point, direction, distance) {
    return [point[0] + distance * direction[0], point[1] + distance * direction[1], point[2] + distance * direction[2]];
}
export function lerp(a, b, amount) {
    let result = [];
    for (let axis = 0; axis < Math.min(3, a.length); axis++) result.push(a[axis] + amount * (b[axis] - a[axis]));
    return result;
}
