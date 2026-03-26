export type NoiseType = 'perlin' | 'ridged' | 'billow' | 'fbm' | 'waveRadial' | 'wavePlanar' | 'waveCross' | 'waveSpiral' | 'waveDiamond';

export type Params = {
    speed: number;
    freq: number;
    exag: number;
    scaleMax: number;
    brightColor: string;
    darkColor: string;
    bgColor: string;
    colorMix: number;
    contrast: number;
    noiseType: NoiseType;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    gridX: number;
    gridY: number;
    gridZ: number;
};

export const DEFAULT_PARAMS: Params = {
    speed: 1.01,
    freq: 0.25,
    exag: 1.3,
    scaleMax: 3.0,
    brightColor: '#ffffff',
    darkColor: '#000000',
    bgColor: '#808080',
    colorMix: 3.0,
    contrast: 2.78,
    noiseType: 'perlin',
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    gridX: 20,
    gridY: 20,
    gridZ: 20,
};
