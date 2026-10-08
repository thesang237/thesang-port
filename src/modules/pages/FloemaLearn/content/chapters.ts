export type ChapterId = 'map' | 'motion' | 'gestures' | 'loops' | 'webgl' | 'hover' | 'reveal' | 'collections' | 'product' | 'about' | 'routes' | 'performance' | 'build';
export type Card = { question: string; answer: string };
export type Chapter = {
    id: ChapterId;
    label: string;
    title: string;
    lead: string;
    lens: string;
    terms: string[];
    logic: string[];
    remember: string;
    caution: string;
    tryThis: string[];
    remixes: { title: string; text: string }[];
    files: string[];
    cards: Card[];
};
export const CHAPTERS: Chapter[] = [
    {
        id: 'map',
        label: 'The map',
        title: 'One set of numbers. Two ways to draw.',
        lead: 'Floema feels like one moving composition. Underneath, real HTML draws the text and controls, while WebGL draws the photos. Both read the same animation numbers, so their positions agree.',
        lens: 'Think of an After Effects composition: separate layers share the same playhead. HTML is your type layer; the canvas is your image layer.',
        terms: ['DOM', 'WebGL', 'state'],
        logic: [
            'A wheel or drag changes a target number. The clock moves the current number toward it.',
            'HTML and the 3D scene read current, not separate copies of scroll. React updates when a page or product changes.',
            'Home loops vertically. Collections clamp horizontally. About clamps vertically. The same pipeline serves three different compositions.',
        ],
        remember: 'Share the motion numbers, then let each renderer draw its own layer.',
        caution: 'Two independent scroll values can drift apart: the photo moves, but its clickable HTML area stays behind.',
        tryThis: ['Move the shared progress dial. Watch the image and its HTML label agree.', 'Turn off shared values to see the label detach from the image.'],
        remixes: [
            { title: 'Museum wall', text: 'Use one horizontal position for artwork in WebGL and accessible HTML captions over it.' },
            { title: 'Editorial cover', text: 'Keep crisp article text in HTML while a photo canvas responds to the same progress.' },
        ],
        files: ['FloemaExperience.tsx', 'scene.ts', 'context.ts'],
        cards: [
            { question: 'Why keep the text in HTML?', answer: 'It stays readable, selectable, responsive, and accessible. WebGL handles the visual photo effects.' },
            { question: 'What should the HTML and canvas share?', answer: 'The same current motion values and layout calculations.' },
            { question: 'When should React update?', answer: 'When discrete UI changes, such as the selected product, not for every animation frame.' },
        ],
    },
    {
        id: 'motion',
        label: 'Motion',
        title: 'A target says where. A curve says how.',
        lead: 'A photo follows your scroll with a soft catch-up. A page wipe starts slowly, moves fast, and settles. These are different jobs: damping follows changing input; easing shapes a timed journey.',
        lens: 'Easing is the graph editor between two keyframes. Damping is a camera operator following a subject that keeps changing direction.',
        terms: ['easing', 'damping', 'ticker', 'stagger'],
        logic: [
            'Floema uses a custom cubic curve (.77, 0, .175, 1) for many arrivals, and expo.inOut for flips and page wipes.',
            'Home and collections damp with 0.1; About uses 0.07, so it trails a little more. The helper accounts for elapsed time, including 120Hz screens.',
            'A stagger offsets the start of each item. It does not change the duration of each item. The GSAP ticker supplies a common clock.',
        ],
        remember: 'Use easing for a planned trip; damping for a moving target.',
        caution: 'Moving 10% closer on every frame without accounting for time makes the same animation feel faster on a 120Hz display.',
        tryThis: ['Set response to 1: the follower snaps to the target.', 'Compare 60Hz and 120Hz with frame correction disabled. Then enable it.'],
        remixes: [
            { title: 'Soft cursor', text: 'Feed pointer X into the same damp helper to make a restrained image follower.' },
            { title: 'Type cascade', text: 'Use a small stagger on a sentence; use a larger one on a short list of project titles.' },
        ],
        files: ['motion.ts', 'FloemaExperience.tsx'],
        cards: [
            { question: 'Easing or damping for a drag follower?', answer: 'Damping: the target keeps moving, so a fixed start/end timeline is the wrong model.' },
            { question: 'What does stagger change?', answer: 'Each item’s start time. Floema uses 10–20ms for hover letters and 100ms for About lines.' },
            { question: 'Why include delta time?', answer: 'So the motion takes the same real time on different refresh rates.' },
        ],
    },
    {
        id: 'gestures',
        label: 'Gestures',
        title: 'Several inputs can control the same thing.',
        lead: 'Wheel-down moves the collection sideways. Drag-left does the same. Keyboard arrows reach the same products. Each input translates into a change to one target, rather than running a different animation.',
        lens: 'A prototype can have several triggers pointing to the same variant. Here, several triggers write to the same position number.',
        terms: ['pointer capture', 'clamp'],
        logic: [
            'Wheel deltas can arrive in pixels, lines, or pages. Floema converts them into pixels before using them.',
            'A drag remembers the starting position, then adds distance from pointer-down. Pointer capture keeps receiving movement outside the original element.',
            'After more than 6px of combined movement, Floema treats the gesture as a drag and suppresses its following click. Home/End and arrows update the target too.',
        ],
        remember: 'Normalize the input, update the target, and let the motion system do the rest.',
        caution: 'Without a drag threshold, releasing a swipe on a product can accidentally open it. Keep form fields and native dialog scrolling outside the gesture handler.',
        tryThis: ['Drag the card more than 6px, release, then try a still click.', 'Set the threshold to 0. Notice how tiny hand movements become drags.'],
        remixes: [
            { title: 'Contact sheet', text: 'Use horizontal drag for browsing photos, but leave each photo as a real focusable button.' },
            { title: 'Scrub a sculpture', text: 'Map the same drag distance to a 3D object’s angle rather than a gallery position.' },
        ],
        files: ['hooks/useGesture.ts', 'pages/Home.tsx', 'pages/Collections.tsx', 'pages/About.tsx'],
        cards: [
            { question: 'Why normalize wheel deltas?', answer: 'Browsers and devices can report different units. Convert them before feeding the target.' },
            { question: 'What does pointer capture solve?', answer: 'The drag continues even if the pointer leaves the element.' },
            { question: 'Why suppress the click after a drag?', answer: 'The pointer-up may otherwise trigger a product click at the end of a swipe.' },
        ],
    },
    {
        id: 'loops',
        label: 'Infinite loops',
        title: 'An endless gallery has a finite set of photos.',
        lead: 'The home photos and giant titles never reach an end. Each item returns to the opposite side after it leaves the visible area. Its wrapped position changes; the underlying list does not grow.',
        lens: 'Imagine a repeating pattern tile sliding behind a frame. The tile is finite; the frame makes it look endless.',
        terms: ['wrap', 'modulo'],
        logic: [
            'The wrap helper keeps a number inside a range. It also handles negative movement, unlike a bare JavaScript remainder.',
            'Home lays out 5 columns on desktop and 2 on phones, keeps image aspect ratios, and wraps each photo’s Y position. Titles repeat a measured cycle.',
            'The source adds 120 pixels per second of drift. Wheel and drag adjust the same target. Reduced motion removes the automatic drift.',
        ],
        remember: 'Wrap positions around a measured cycle, not around the viewport alone.',
        caution: 'The cycle must include gaps and cover the viewport. A wrong cycle length creates a visible seam or stacks cards on top of each other.',
        tryThis: ['Scrub past one full cycle, then below zero.', 'Turn wrapping off to expose the finite list behind the illusion.'],
        remixes: [
            { title: 'Film credits', text: 'Wrap a vertical typographic pattern at a slow speed behind a stationary title.' },
            { title: 'Infinite color swatches', text: 'Recycle a row of material samples and replace the content only while a card is off screen.' },
        ],
        files: ['motion.ts', 'scene.ts', 'pages/Home.tsx', 'components/VerticalTitles.tsx'],
        cards: [
            { question: 'Does an infinite gallery need infinite DOM nodes?', answer: 'No. It reuses a finite set and wraps their positions.' },
            { question: 'What belongs in the cycle length?', answer: 'Every item size and gap in the repeating sequence.' },
            { question: 'Why handle negative wrapping?', answer: 'The user can reverse direction. A negative remainder alone does not return a position inside the intended range.' },
        ],
    },
    {
        id: 'webgl',
        label: 'WebGL photos',
        title: 'A photo is a plane you can bend.',
        lead: 'Floema’s portraits arrive from depth, then flex when you scroll quickly. They are textured rectangles in a perspective camera. A short vertex shader moves the rectangle’s points forward and backward along a sine curve.',
        lens: 'A texture is a photo on a layer. Subdivisions are a mesh warp grid. A vertex shader is the rule that moves each point in that grid.',
        terms: ['texture', 'vertex shader', 'uniform', 'perspective'],
        logic: [
            'The camera uses a 45° field of view at z = 5. The visible world height is 2 × tan(45° / 2) × 5. Divide by viewport height to convert pixels into world units.',
            'The home plane has 20 × 20 segments. The shader adds sin(y / height × π + π/2) × speed to depth. The target-current gap supplies the speed signal.',
            'Entrance depth starts between 2 and 6 and returns to 0 over 2 seconds. Opacity settles at 0.4; batches start 0.16 seconds apart. Text stays in HTML.',
        ],
        remember: 'More mesh points let a simple formula make a smooth bend.',
        caution: 'A four-corner plane cannot visibly curve in the middle. Do not add a 3D model or lights for an effect that only needs a textured plane.',
        tryThis: ['Set segments to 1, then 20. Compare the silhouette.', 'Exaggerate the bend, then scrub entrance progress to see depth and opacity work together.'],
        remixes: [
            { title: 'Paper poster', text: 'Use a localized sine wave to curl a poster edge when it is dragged.' },
            { title: 'Fabric archive', text: 'Slow the frequency and reduce the amplitude to suggest a sheet of fabric breathing.' },
        ],
        files: ['canvas/Scene.tsx', 'scene.ts', 'FloemaExperience.tsx'],
        cards: [
            { question: 'What is a uniform?', answer: 'A shared value passed into a shader, such as speed or opacity.' },
            { question: 'Why subdivide the plane?', answer: 'The shader needs intermediate points to form a visible curve.' },
            { question: 'Why convert pixels into world units?', answer: 'So the 3D photo aligns with its HTML layout and hit area.' },
        ],
    },
    {
        id: 'hover',
        label: 'Hover details',
        title: 'Small effects need clean start and end states.',
        lead: 'Letters roll away as their twins roll in. The bright oval line draws around the button from empty to complete. Two small timelines create the effect; leaving reverses them from their current position.',
        lens: 'The letter roll is two copies of a text layer rotating through a mask. The outline is After Effects Trim Paths on an ellipse.',
        terms: ['stagger', 'stroke dash', 'timeline'],
        logic: [
            'Each letter has a front and back copy. Front rotates X from 0 to −90°; back rotates 90° to 0. A slight Y rotation adds a turn.',
            'Letters take 0.5 seconds, with 0.01s stagger on the oval button and 0.02s on links. Back letters start 0.05s later.',
            'Measure the ellipse length L. Set dasharray to L L and dashoffset to L, then animate offset to 0 in 1 second. Pointer leave reverses; keyboard focus uses the same handlers.',
        ],
        remember: 'Build a complete hidden state and a complete visible state, then animate between them.',
        caution: 'Do not subtract another path length on every hover. It accumulates across visits and no longer means “draw from empty.” Keep duplicated text aria-hidden and name the button once.',
        tryThis: [
            'Increase the letter stagger to 0.1s: the button feels like a sentence instead of one gesture.',
            'Enter and leave quickly. Watch the effect reverse without queuing a second animation.',
        ],
        remixes: [
            { title: 'Signature underline', text: 'Use the same measured path on a hand-drawn underline rather than an oval.' },
            { title: 'Museum labels', text: 'Apply the letter roll only to short exhibit links; keep body text still.' },
        ],
        files: ['components/AnimatedControl.tsx', 'floema.css'],
        cards: [
            { question: 'How do you hide a measured SVG stroke?', answer: 'Use dasharray L L and dashoffset L, where L is the path length.' },
            { question: 'Why reverse a hover timeline?', answer: 'It returns smoothly from its current position, including a quick enter/leave.' },
            { question: 'What is the keyboard equivalent of hover here?', answer: 'Focus and blur run the same enter and leave logic.' },
        ],
    },
    {
        id: 'reveal',
        label: 'Text reveals',
        title: 'Move the text. Keep the mask still.',
        lead: 'About headings rise through invisible line-sized windows. They play once when reached, then stay visible when you scroll back. The intro uses the same masking idea with overlapping line and word animation.',
        lens: 'In After Effects, the mask stays on the parent layer while the child text moves. A once-only reveal is a cue you trigger, not a playhead you scrub backward.',
        terms: ['mask', 'SplitText', 'stagger'],
        logic: [
            'SplitText finds the actual rendered lines and creates a mask for each. Each child moves from yPercent 100 to 0 over 1.5 seconds with 0.1s stagger.',
            'About records played blocks in a WeakSet. It only starts a reveal if the block is visible and has not played. autoSplit recalculates line breaks after font loading or resize; played blocks retain their finished state.',
            'The intro layers 1.5s line motion and 1s word motion, waits for images or a 4s deadline, then exits. The counter tracks unique home image requests; errors also complete a request. At the deadline, 100% means the intro gate has ended, not that every WebGL texture is ready. Highlight titles fade and settle from scale 1.2 to 1 after 0.5s.',
        ],
        remember: 'The mask hides travel; the played flag prevents a scroll-back replay.',
        caution: 'Split after fonts are ready or use autoSplit. Preserve the finished state on re-split. Give the accessible sentence once, rather than reading every animated fragment.',
        tryThis: ['Scroll inside the demo until the heading appears, then scroll back and repeat.', 'Disable “Once” to feel the difference. Try “Highlight” for the scale-and-fade variation.'],
        remixes: [
            { title: 'Poetry reveal', text: 'Use a generous line stagger for a short poem, triggered once at the reader’s pace.' },
            { title: 'Compact loader', text: 'Keep the line reveal but replace the lengthy intro with one sentence and honest asset progress.' },
        ],
        files: ['pages/About.tsx', 'components/Intro.tsx', 'components/RichText.tsx'],
        cards: [
            { question: 'Which element moves: mask or text?', answer: 'The text moves inside a stationary mask.' },
            { question: 'What prevents reveal replay?', answer: 'A played flag checked before starting the animation, preserved when lines re-split.' },
            { question: 'Why split on resize?', answer: 'Responsive text can wrap into different lines, so the masks must match the new layout.' },
        ],
    },
    {
        id: 'collections',
        label: 'Collections',
        title: 'Change the caption as one group.',
        lead: 'The collection gallery floats sideways over huge vertical names. The current card stays bright while neighbors dim. When you enter another collection, its title and description arrive as one coordinated group.',
        lens: 'Treat title and description as layers in one precomp. A single timeline owns the outgoing group and incoming group.',
        terms: ['clamp', 'timeline', 'stagger'],
        logic: [
            'Cards use a 46.36-unit step: 35.76 units of photo plus 10.6 of gap. Current position determines the active product and its collection; the current card has opacity 1 and neighbors 0.4.',
            'cardPose adds a slow sine float and a position-dependent tilt. The HTML button and WebGL card use that same pose. Giant titles map each collection’s horizontal span onto its vertical title height.',
            'The caption timeline kills any interrupted version, moves all outgoing lines up with 40ms offsets, hides the old group, then brings all incoming lines up with 60ms offsets. Name and description share the same ownership.',
        ],
        remember: 'Group related copy under one timeline, with one handoff between old and new.',
        caution: 'Separate CSS transition delays and GSAP transforms can leave an old description moving after the new title appears. One owner per property prevents that race.',
        tryThis: ['Switch collection rapidly during the animation. The latest choice should win.', 'Increase the line offset and notice how long the group takes to finish.'],
        remixes: [
            { title: 'Album sleeve browser', text: 'Use the active-card mapping to change artist, album title, and track count together.' },
            { title: 'Materials library', text: 'Synchronize a large material name with small composition and care details.' },
        ],
        files: ['pages/Collections.tsx', 'scene.ts', 'components/VerticalTitles.tsx'],
        cards: [
            { question: 'Why put title and description in one timeline?', answer: 'They belong to the same change and must finish the same handoff before the new group arrives.' },
            { question: 'What should a new selection do to a running caption transition?', answer: 'Kill the interrupted timeline and animate toward the latest selection.' },
            { question: 'What keeps a photo and its click target aligned?', answer: 'Both renderers use the same cardPose calculation.' },
        ],
    },
    {
        id: 'product',
        label: 'Product opening',
        title: 'One progress value can transform a whole layout.',
        lead: 'Click the current product and its photo grows into the detail layout while turning a full circle. Its neighbors fade. Text and icons arrive during the same opening, and closing takes the photo back to the gallery.',
        lens: 'This is a shared-element transition: the photo is the visual connection between two layouts. One playhead drives position, size, angle, and surrounding emphasis.',
        terms: ['interpolation', 'shared element', 'inert'],
        logic: [
            'Measure the detail photo’s HTML rectangle once and on resize. expansion goes 0→1 over 2s with expo.inOut. mix(start, end, expansion) drives X, Y, width, height, and tilt; flip is expansion × 2π.',
            'Two planes show different front/back photos. Unselected cards fade in 0.5s. Detail content starts after 0.5s: masked lines, letters and words rise; icons fade, rotate 45→0°, and their inner marks scale 0.5→1.',
            'The dialog traps focus, closes with Escape, and restores focus to the opener. The gallery becomes inert. Closing fades the detail copy in 0.4s while the photo returns. On phones the detail scroll is native; its scroll offset is subtracted from the canvas photo’s Y.',
        ],
        remember: 'Drive every part of a layout change with the same progress value.',
        caution:
            'Measure before animating, not on every frame. Keep the dialog scrollable and the Close control reachable. A focusable HTML button must still exist when its image is rendered in WebGL.',
        tryThis: ['Scrub the opening to 0.5 and inspect position, size, and rotation.', 'Open then close before the turn finishes. It should reverse from its current position.'],
        remixes: [
            { title: 'Exhibition card', text: 'Expand a small artwork into a reading panel while keeping the artwork as the shared element.' },
            { title: 'Front / reverse', text: 'Use half a turn to reveal the back of a postcard, a print, or a collectible.' },
        ],
        files: ['scene.ts', 'pages/Collections.tsx', 'components/ProductDetail.tsx', 'canvas/Scene.tsx'],
        cards: [
            { question: 'What does mix(a, b, p) do?', answer: 'It finds the value between a and b at progress p. At 0 it is a; at 1 it is b.' },
            { question: 'How much rotation is a full turn in radians?', answer: '2π. Floema multiplies expansion by 2π.' },
            { question: 'What should happen to focus on close?', answer: 'It returns to the product button that opened the dialog.' },
        ],
    },
    {
        id: 'about',
        label: 'About galleries',
        title: 'Different speeds make a flat page feel deep.',
        lead: 'The About content glides upward while photos move slightly within their frames. Curved image rows drift sideways and respond to dragging. None of this needs a complex 3D world: it comes from position, a curve, and a small speed difference.',
        lens: 'Parallax is a multiplane animation: the frame and image move at different rates. The curved row is a path of positions, with each image rotated to fit its place.',
        terms: ['parallax', 'normalize', 'wrap'],
        logic: [
            'About clamps its target to content height minus viewport height, damps with 0.07, and translates the wrapper upward. Cached section positions drive visibility and parallax.',
            'Each photo maps its trip through the viewport into 0→1. Its image moves +50→−50px on desktop (+10→−10px on narrow screens) while scaling 1→1.15 inside a clipped frame.',
            'Rows wrap horizontally at 60px/s. A cosine curve adjusts height and position-based rotation forms the arc; scroll lag adds a horizontal push. Highlights reveal once; the footer simply travels with the content wrapper.',
        ],
        remember: 'A small difference in movement is enough to suggest depth.',
        caution: 'The image must have extra size around the frame, or parallax exposes blank edges. Do not make reading speed depend on how fast the decorative gallery moves.',
        tryThis: ['Scrub the photo from 0 to 1. Raise travel to expose why extra image coverage matters.', 'Flatten the row curve, then exaggerate it. Try “Record shelf” for a related use.'],
        remixes: [
            { title: 'Record shelf', text: 'Reuse the curved, tilted row for album covers and let a drag change its direction.' },
            { title: 'Travel diary', text: 'Use low-distance image parallax between calm text passages to create depth without a pinned scene.' },
        ],
        files: ['pages/About.tsx', 'canvas/Scene.tsx', 'FloemaExperience.tsx'],
        cards: [
            { question: 'What creates parallax?', answer: 'Two layers move at different rates, such as an image inside its moving frame.' },
            { question: 'Why clamp About scrolling?', answer: 'It is a finite story. The target must stay between the top and the end of the content.' },
            { question: 'Does the footer need its own animation?', answer: 'No. In Floema it moves naturally with the translated content wrapper.' },
        ],
    },
    {
        id: 'routes',
        label: 'Page transitions',
        title: 'Cover first. Swap underneath. Reveal last.',
        lead: 'A curved sheet fills the viewport before Floema changes pages. The destination appears only as the sheet retreats. Keeping the old view mounted until full coverage makes the transition feel continuous.',
        lens: 'It is a scene change hidden by an animated matte. The page switch is a cut; the curtain hides the cut.',
        terms: ['timeline', 'state machine'],
        logic: [
            'A progress number raises an SVG edge from bottom to top. Its center bows with a sine curve; the bow amplitude also rises and falls with progress.',
            'Cover lasts 1.5s with expo.inOut. Only on full coverage does Next.js change the route and the visible view. Rotate the same curtain 180° and animate progress 1→0 for uncover.',
            'A pending destination guards repeat clicks. Browser history follows the same cover/swap/uncover sequence. On completion the destination heading receives focus without scrolling. Reduced motion uses a short 0.12s handoff.',
        ],
        remember: 'Change the visible page only while the curtain fully covers it.',
        caution: 'SVGs can inherit a 150px default height. A full-page transition needs explicit viewport width and height, plus correct stacking over navigation.',
        tryThis: ['Scrub to the midpoint of the whole transition and look for the hidden page swap.', 'Set bow to zero for a straight wipe; exaggerate it to reveal how the curve is constructed.'],
        remixes: [
            { title: 'Gallery color sheet', text: 'Let the next artwork’s background color become the curtain, so the destination is foreshadowed.' },
            { title: 'Straight editorial wipe', text: 'Use the same lifecycle with a simple rectangle for a quieter portfolio transition.' },
        ],
        files: ['FloemaExperience.tsx', 'floema.css'],
        cards: [
            { question: 'When does the page swap?', answer: 'After full coverage, before uncovering.' },
            { question: 'Why keep the old page mounted?', answer: 'Its content remains visible throughout the cover phase and does not flash away early.' },
            { question: 'What follows the transition for keyboard users?', answer: 'Focus moves to the destination heading, without an accidental scroll.' },
        ],
    },
    {
        id: 'performance',
        label: 'Performance',
        title: 'Spend frames on the effect, not on bookkeeping.',
        lead: 'Smooth motion depends on avoiding unnecessary work. Floema shares geometry and textures, skips off-screen cards, and writes changing values directly to its renderers. React remains responsible for UI structure and meaningful state changes.',
        lens: 'Reuse a component instead of duplicating heavy assets. Hide layers that cannot be seen. Judge the playback on the actual machine, not by how small the project file looks.',
        terms: ['draw call', 'DPR', 'dispose', 'instancing'],
        logic: [
            'At 60fps a frame has roughly 16.7ms. Measure frame intervals, draw calls, geometries, and textures while interacting. A fast idle scene does not prove a fast scroll.',
            'Floema shares flat and subdivided planes and deduplicates texture URLs. It caps DPR at 1.5, culls invisible items, and pauses when the tab is hidden. Different photo textures mean instancing is not automatically a drop-in improvement.',
            'The guide below compares identical repeated meshes with an InstancedMesh. Both draw the same visual; their draw-call cost differs. On unmount, dispose owned resources, remove tickers/listeners, and preserve a DOM fallback.',
        ],
        remember: 'Measure first, then remove work that does not change the visible result.',
        caution: 'A low draw-call count is one signal, not a complete speed score. High DPR, large textures, too many vertices, and main-thread work can still be expensive.',
        tryThis: ['Compare separate meshes and instancing at the same count.', 'Switch chapters five times; the previous canvas should disappear rather than accumulate.'],
        remixes: [
            { title: 'One scene, many labels', text: 'Keep a single GPU stage and use HTML labels for navigation and detail controls.' },
            { title: 'Still mode', text: 'Design a static composition for reduced motion and WebGL failure instead of leaving an empty canvas.' },
        ],
        files: ['canvas/Scene.tsx', 'FloemaExperience.tsx', 'floema.css'],
        cards: [
            { question: 'What is a draw call?', answer: 'A command asking the GPU to draw a batch. Many separate meshes often mean many calls.' },
            {
                question: 'Does instancing suit every photo gallery?',
                answer: 'Not automatically. It works well when instances share geometry and material; different photo textures need additional planning.',
            },
            { question: 'What needs cleanup when a demo leaves?', answer: 'Owned GPU resources, frame callbacks, observers, and event listeners.' },
        ],
    },
    {
        id: 'build',
        label: 'Build your own',
        title: 'Start with one effect and a clear reason.',
        lead: 'You do not need the whole Floema system to make something expressive. Pick a useful interaction, define its start and end, build the smallest version, then add motion and accessibility. The planner gives you a compact brief to take into your own project.',
        lens: 'Storyboard the states before opening the graph editor. Name the trigger, what changes, and what happens if the user interrupts it.',
        terms: ['state machine', 'interpolation'],
        logic: [
            'First build the static composition with real text and controls. Then choose the one number that should drive the effect.',
            'Use a timed curve for a reveal or transition; damp a moving input; wrap an endless position; clamp a finite journey.',
            'Add keyboard operation, reduced motion, a fallback, and cleanup. Test interruption and phone layout before adding another effect.',
        ],
        remember: 'A clear trigger and one shared progress value beat a pile of unrelated animations.',
        caution: 'Do not begin by rebuilding the entire site. Finish one interaction that works on a phone, with a keyboard, and when interrupted.',
        tryThis: ['Write a brief for a postcard that flips to show a message.', 'Choose a calmer variation and remove a decorative motion that does not help the idea.'],
        remixes: [
            { title: 'Postcard studio', text: 'Gesture threshold → shared-element flip → masked message reveal. Keep the page itself still.' },
            { title: 'Specimen archive', text: 'Infinite row → active specimen → synchronized name and description. Add a simple straight route wipe only if needed.' },
            { title: 'Festival program', text: 'Once-only line reveals and path-drawn links. No WebGL is required.' },
        ],
        files: ['motion.ts', 'scene.ts', 'hooks/useGesture.ts'],
        cards: [
            { question: 'What should you design before the animation?', answer: 'The static states, trigger, purpose, and interruption behavior.' },
            { question: 'What is a good first creative-development project?', answer: 'One small interaction that you can finish, explain, and make accessible.' },
            { question: 'When should you add WebGL?', answer: 'When the visual needs depth, mesh deformation, or another capability that simpler HTML/CSS cannot provide cleanly.' },
        ],
    },
];
export const isChapter = (value: string): value is ChapterId => CHAPTERS.some((chapter) => chapter.id === value);
export const chapterFromHash = (): ChapterId => {
    const value = typeof window === 'undefined' ? '' : window.location.hash.slice(1);
    return isChapter(value) ? value : 'map';
};
