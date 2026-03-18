export const mapRange = (params: { value: number; inMin: number; inMax: number; outMin: number; outMax: number }): number => {
    return ((params.value - params.inMin) * (params.outMax - params.outMin)) / (params.inMax - params.inMin) + params.outMin;
};

export const lerp = (params: { start: number; end: number; amount: number }): number => {
    return params.start * (1 - params.amount) + params.end * params.amount;
};

export const clamp = (params: { value: number; min: number; max: number }): number => {
    return Math.max(Math.min(params.value, params.max), params.min);
};

export const random = (params: { min: number; max: number }): number => {
    return Math.random() * (params.max - params.min) + params.min;
};

export const radiansToDegrees = (radians: number): number => {
    return radians * (180 / Math.PI);
};

export const degreesToRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};
