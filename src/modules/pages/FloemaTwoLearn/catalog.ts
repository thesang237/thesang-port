export const chapters = [
    { id: 'map', label: 'The map', title: 'One experience. A few clear layers.', blurb: 'See the system before you build the effects.', minutes: 5 },
    { id: 'clock', label: 'One clock', title: 'Smooth is a relationship, not a speed.', blurb: 'Connect scroll input, smoothing, and animation time.', minutes: 6 },
    { id: 'scenes', label: 'Scroll scenes', title: 'Let the frame reveal the picture.', blurb: 'Map scroll to masks, holds, and quiet parallax.', minutes: 8 },
    { id: 'text', label: 'Text rhythm', title: 'Give each thought its own entrance.', blurb: 'Use offsets and stagger to make hierarchy visible.', minutes: 5 },
    { id: 'depth', label: 'Depth', title: 'Move through space, not around it.', blurb: 'Build the advancing image field with perspective.', minutes: 8 },
    { id: 'handoff', label: 'The handoff', title: 'Two renderers. One shared silhouette.', blurb: 'Match a wireframe to a photograph without a jump.', minutes: 7 },
    { id: 'materials', label: 'Materials', title: 'Light tells you what a surface is.', blurb: 'Explore roughness, metalness, and tactile rotation.', minutes: 8 },
    { id: 'hover', label: 'Hover', title: 'A small gesture can carry the identity.', blurb: 'Connect moving pills and expand cycling previews.', minutes: 7 },
    { id: 'transitions', label: 'Page changes', title: 'Make leaving and arriving one event.', blurb: 'Sequence route changes and keep the canvas stable.', minutes: 6 },
    { id: 'interaction', label: 'Interaction', title: 'One result, more than one way in.', blurb: 'Give pointer, touch, and keyboard equal control.', minutes: 6 },
    { id: 'performance', label: 'Performance', title: 'The best frame is the one you skip.', blurb: 'Measure the budget and stop invisible work.', minutes: 7 },
    { id: 'build', label: 'Build your own', title: 'Start with a storyboard. End with a system.', blurb: 'Turn a sequence into a working plan and test your recall.', minutes: 10 },
] as const;
export type ChapterId = (typeof chapters)[number]['id'];
export type RecallCard = { q: string; a: string };
export const cards: Record<ChapterId, RecallCard[]> = {
    map: [
        { q: 'Why keep headings outside the canvas?', a: 'Real DOM text stays selectable, accessible, crisp, and present when WebGL fails.' },
        { q: 'What should scrolling write into a 3D scene?', a: 'Plain numbers in a mutable dials object. The frame loop reads those numbers and moves the scene.' },
        { q: 'What should you measure before cloning a reference?', a: 'Viewport, grid anchors, scene boundaries, timing, asset dimensions, and the pointer state at each capture.' },
    ],
    clock: [
        { q: 'Why set Lenis autoRaf to false?', a: 'GSAP already supplies the animation clock. A second loop would update the same scroller independently.' },
        { q: 'What does a lower smoothing value feel like?', a: 'The follower closes less of the distance each moment, so it feels heavier and takes longer to settle.' },
        { q: 'Why use elapsed time when smoothing?', a: 'A time-based response behaves consistently at different refresh rates instead of moving twice as fast at 120Hz.' },
    ],
    scenes: [
        { q: 'How is scroll position turned into progress?', a: 'Subtract the start, divide by the available travel, then clamp the result to 0–1.' },
        { q: 'Why reveal a mask instead of moving the whole photo?', a: 'The photograph stays anchored while the frame grows. A small independent image offset supplies parallax.' },
        { q: 'Why should a scrubbed timeline use linear easing?', a: 'Scroll already controls time. Another ease can make the image accelerate unexpectedly relative to the playhead.' },
    ],
    text: [
        { q: 'What is the difference between delay and stagger?', a: 'Delay holds the start of a group; stagger offsets the individual elements inside it.' },
        { q: 'What are the source’s calm reveal values?', a: '700ms and 18px of travel with the smooth-out curve. The collection badge, heading, and button start at 60, 140, and 240ms.' },
        { q: 'What should reduced motion keep?', a: 'The words, their hierarchy, and every action. Remove travel and staggering; a short fade is enough.' },
    ],
    depth: [
        { q: 'Why do the images grow without animating their scale?', a: 'A perspective camera makes a fixed-size plane appear larger as it approaches the camera.' },
        { q: 'How do you hide an image’s recycle point?', a: 'Fade it at the near limit, wrap its distance to the far limit, then fade it back in.' },
        { q: 'What keeps scroll acceleration from snapping?', a: 'Scroll velocity decays and the travel speed is damped toward its target instead of changing instantly.' },
    ],
    handoff: [
        { q: 'What must two layers share for a convincing handoff?', a: 'The same visible width, top position, center, orientation, and reveal coordinate system.' },
        { q: 'Why use an orthographic camera for the wireframe?', a: 'Its visible width is predictable, making it easier to match a DOM photograph in screen space.' },
        { q: 'When should the wireframe finish turning?', a: 'Before the photo begins to uncover it. Otherwise their edges diverge along the seam.' },
    ],
    materials: [
        { q: 'What does roughness change?', a: 'The spread of the highlight. Low roughness makes a tight reflection; high roughness spreads it across the surface.' },
        { q: 'Does a normal map change the silhouette?', a: 'No. It changes the apparent direction of the surface for lighting, adding detail without more geometry.' },
        { q: 'Why keep drag values in a ref?', a: 'The frame loop can read the latest rotation without making React render on every pointer movement.' },
    ],
    hover: [
        { q: 'How does the revised button push right?', a: 'The first piece stays fixed. Each later piece adds the opened gaps before it to its horizontal position.' },
        { q: 'Why overwrite an unfinished hover tween?', a: 'A fast pointer change should continue from the current shape, not queue old hover animations.' },
        { q: 'When should the collection preview stop cycling?', a: 'When the row loses hover/focus, the section is offscreen, the document is hidden, or reduced motion is enabled.' },
    ],
    transitions: [
        { q: 'When does navigation happen in the source?', a: 'After the 240ms exit has finished, then the new content enters over 560ms.' },
        { q: 'Why avoid transforming the entire route wrapper?', a: 'A transformed ancestor changes the containing block of fixed descendants and can break the full-viewport canvas.' },
        { q: 'What must happen after the new page arrives?', a: 'Resume scrolling, reset or restore the intended scroll position, and move focus to the new heading.' },
    ],
    interaction: [
        { q: 'Why is the comparison control a native range input?', a: 'It provides keyboard and touch behavior, a value, and accessible semantics without rebuilding them by hand.' },
        { q: 'What should happen when a dialog closes?', a: 'Return focus to its trigger, release the scroll lock, and remove the dialog’s listeners.' },
        { q: 'Can a hotspot depend only on hover?', a: 'No. Focus and click must reach the same information, and the button must expose whether it is expanded.' },
    ],
    performance: [
        { q: 'What is the frame budget at 60fps?', a: 'About 16.7ms for the browser to complete a frame, including work outside your own code.' },
        { q: 'Why is DPR an effective performance dial?', a: 'Pixel cost grows quadratically. DPR 2 paints four times the pixels of DPR 1; the source caps it at 1.5.' },
        { q: 'What do you clean up when leaving a 3D chapter?', a: 'Its ticker, observers, event listeners, geometry, materials, textures, renderer, and WebGL context.' },
    ],
    build: [
        { q: 'What do you build before fine motion?', a: 'The static composition and semantic controls. Motion should refine a layout that already works.' },
        { q: 'How do you prevent two tools fighting over an effect?', a: 'Give each animated property one owner and keep that owner responsible for its initial and final values.' },
        { q: 'What makes a motion specification reviewable?', a: 'Named inputs, start and end values, timing, hold lengths, reverse behavior, fallbacks, and captures at matching moments.' },
    ],
};
