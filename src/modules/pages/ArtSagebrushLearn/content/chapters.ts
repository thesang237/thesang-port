export const CHAPTERS = [
    { id: 'map', label: 'The map', title: 'A landscape written in ink.', blurb: 'Follow a number from a seeded field to a mark on paper.' },
    { id: 'seeds', label: 'Seeds', title: 'Make chance repeat itself.', blurb: 'Separate the shape of a world from the decisions made inside it.' },
    { id: 'terrain', label: 'Terrain', title: 'Build a hill from three scales.', blurb: 'Layer broad structure and small detail without losing the silhouette.' },
    { id: 'erosion', label: 'Erosion', title: 'Let the valleys find their way.', blurb: 'Let moving droplets edit the field before you draw it.' },
    { id: 'light', label: 'Light & slope', title: 'Let direction do the shading.', blurb: 'Use the same slope to choose a color and turn a stroke.' },
    { id: 'pen', label: 'The ink pen', title: 'Draw with a hand, not a fill.', blurb: 'Turn a perfect path into a fallible, grainy performance.' },
    { id: 'plants', label: 'Plant grammar', title: 'Grow a vocabulary of marks.', blurb: 'Build trunks, branches and leaves from a tiny set of primitives.' },
    { id: 'depth', label: 'Depth', title: 'Make a flat page feel deep.', blurb: 'Displace the marks, but remember where their feet belong.' },
    { id: 'studies', label: 'Creative studies', title: 'Take the ink somewhere new.', blurb: 'Translate a landscape technique into prints and lettering.' },
    { id: 'build', label: 'Make a series', title: 'Leave with your own recipe.', blurb: 'Choose a visual question, save its rules and test your understanding.' },
] as const;
export type ChapterId = (typeof CHAPTERS)[number]['id'];
export const isChapter = (value: string): value is ChapterId => CHAPTERS.some((chapter) => chapter.id === value);
