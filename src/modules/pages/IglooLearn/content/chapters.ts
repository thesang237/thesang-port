export const CHAPTERS = [
    { id: 'map', n: '00', label: 'The map', blurb: 'How one scroll bar runs the whole show' },
    { id: 'smooth', n: '01', label: 'Smooth scroll', blurb: 'Lenis, lerp, damping and the one clock' },
    { id: 'mapping', n: '02', label: 'Progress mapping', blurb: 'Turning scroll into 0→1 and 0→1 into motion' },
    { id: 'timeline', n: '03', label: 'Scroll timeline', blurb: 'One master timeline, scrubbed by scroll' },
    { id: 'text', n: '04', label: 'Text motion', blurb: 'Masked reveals, decoding, drawn lines' },
    { id: 'three', n: '05', label: 'Three.js stage', blurb: 'Scene, camera, light, fog — and camera rails' },
    { id: 'objects', n: '06', label: '3D objects', blurb: 'Instancing, procedural build & explode' },
    { id: 'shaders', n: '07', label: 'Shaders', blurb: 'Painting every pixel at once' },
    { id: 'worlds', n: '08', label: 'Transitions & FX', blurb: 'Four worlds, one compositor pass' },
    { id: 'particles', n: '09', label: 'Particles', blurb: 'Springs, energy, morphs and GPGPU' },
    { id: 'interaction', n: '10', label: 'Interaction', blurb: 'Pointer, picking, HUD, magnetism, sound' },
    { id: 'performance', n: '11', label: 'Performance', blurb: 'How it stays at 60fps' },
    { id: 'build', n: '12', label: 'Build your own', blurb: 'Recipe, storyboard tool and final quiz' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];
