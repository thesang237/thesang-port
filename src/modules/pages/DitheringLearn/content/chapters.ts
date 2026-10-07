export const CHAPTERS = [
    { id: 'map', label: 'The map', promise: 'One image. A small printing press.' },
    { id: 'tone', label: 'Tone', promise: 'Brightness is a decision about ink.' },
    { id: 'ordered', label: 'Ordered', promise: 'Sixteen numbers can draw a shadow.' },
    { id: 'stipple', label: 'Stipple', promise: 'Randomness can hold perfectly still.' },
    { id: 'halftone', label: 'Halftone', promise: 'A circle can carry a whole image.' },
    { id: 'direction', label: 'Direction', promise: 'Change the gesture, keep the form.' },
    { id: 'palette', label: 'Palette', promise: 'Choose the ink after choosing the marks.' },
    { id: 'surface', label: 'Surface', promise: 'Give a perfect image an imperfect surface.' },
    { id: 'runtime', label: 'Runtime', promise: 'Spend pixels where you can see them.' },
    { id: 'build', label: 'Make a print', promise: 'A recipe with a point of view.' },
] as const;
export type ChapterId = (typeof CHAPTERS)[number]['id'];
export const isChapter = (value: string): value is ChapterId => CHAPTERS.some((c) => c.id === value);
