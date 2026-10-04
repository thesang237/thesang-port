export const CHAPTERS = [
    { id: 'map', n: '00', label: 'The map', blurb: 'One scroll number runs nine scenes' },
    { id: 'steps', n: '01', label: 'Steps', blurb: 'The page never scrolls: it moves in steps on a spring' },
    { id: 'story', n: '02', label: 'One number', blurb: 'Every frame asks where the story is' },
    { id: 'worlds', n: '03', label: 'Worlds & wipe', blurb: 'Scenes paint off screen, one shader stitches them' },
    { id: 'titles', n: '04', label: 'GPU titles', blurb: 'Letters drawn from a map of distances' },
    { id: 'scatter', n: '05', label: 'Scatter', blurb: 'The pointer undraws the letters' },
    { id: 'camera', n: '06', label: 'Camera & light', blurb: 'The camera leans in, the light follows' },
    { id: 'bokeh', n: '07', label: 'Bokeh', blurb: 'Out-of-focus dots your pointer focuses' },
    { id: 'strands', n: '08', label: 'Strands', blurb: 'DNA from one curve and a few rules' },
    { id: 'springs', n: '09', label: 'Springs', blurb: 'Everything that sways is a spring' },
    { id: 'fakes', n: '10', label: 'Fakes', blurb: 'Three ways to fake depth (and weather)' },
    { id: 'perf', n: '11', label: 'Performance', blurb: 'Five 3D scenes at 60 fps' },
    { id: 'build', n: '12', label: 'Build your own', blurb: 'Plan a story → config, and the final quiz' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];
