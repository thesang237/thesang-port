import { addVec, dot, rotateXZ } from './math.js';

/** Orthographic camera: all eye rays are parallel; z is vertical in this world. */
export class Camera {
    constructor(x, y, z, tilt, turn, squeeze = 1) {
        this.planeO = [x, y, z];
        this.planeX = rotateXZ(1, 0, 0, tilt, turn);
        this.planeY = rotateXZ(0, 1, 0, tilt, turn);
        this.planeZ = rotateXZ(0, 0, 1, tilt, turn);
        this.squeeze = squeeze;
    }
    moveBack(distance) {
        this.planeO = addVec(this.planeO, this.planeZ, distance);
    }
    direction() {
        return this.planeZ.map((value) => -value);
    }
    project(point, pixelScale, width, height) {
        const relative = point.map((value, axis) => value - this.planeO[axis]);
        return [width / 2 + dot(relative, this.planeX) / pixelScale, height / 2 - dot(relative, this.planeY) / (pixelScale * this.squeeze), -dot(relative, this.planeZ)];
    }
}
