export const CHAPTERS = [
    { id: 'map', n: '00', label: 'The map', blurb: 'One scroll number runs the whole show' },
    { id: 'clock', n: '01', label: 'Film clock', blurb: 'Time in screens, windows and the scroll warp' },
    { id: 'choreo', n: '02', label: 'Choreography', blurb: 'Every card is a formula of time' },
    { id: 'shape', n: '03', label: 'The notched card', blurb: 'One shader draws every card shape' },
    { id: 'faces', n: '04', label: 'Three faces', blurb: 'Turning cards and the pixel stage' },
    { id: 'painted', n: '05', label: 'Painted scenes', blurb: 'Paintings are 3D planes with their own camera' },
    { id: 'masks', n: '06', label: 'Cards are masks', blurb: 'The card moves, the picture stays' },
    { id: 'pointer', n: '07', label: 'Pointer layers', blurb: 'Two follow speeds make the depth' },
    { id: 'ring', n: '08', label: 'Gallery ring', blurb: 'A cylinder of cards, drag and momentum' },
    { id: 'flipbooks', n: '09', label: 'Flipbooks & wipes', blurb: 'Sprite sheets, the logo wipe, the opening' },
    { id: 'words', n: '10', label: 'Words over WebGL', blurb: 'Anchors, reveals, decoding, the button' },
    { id: 'perf', n: '11', label: 'Performance', blurb: 'Only what is on screen costs anything' },
    { id: 'build', n: '12', label: 'Build your own', blurb: 'Storyboard → code, and the final quiz' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];
