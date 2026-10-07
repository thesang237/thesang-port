const STAGES = [
    ['seeds', '01', 'Choose', 'Two seeds', 'Separate the random choices from the smooth spatial variation.'],
    ['terrain', '02', 'Build', 'Height field', 'Three noise layers provide structure at three scales.'],
    ['erosion', '03', 'Weather', 'Erosion', 'Droplets edit the field before any marks are planned.'],
    ['light', '04', 'Read', 'Slope & light', 'Neighboring heights determine the local direction and palette bin.'],
    ['plants', '05', 'Compose', 'Plants & shadows', 'Place the vegetation and write its shadows before coloring the ground.'],
    ['depth', '06', 'Arrange', 'Depth stack', 'Sort by the original ground row, before screen displacement.'],
    ['pen', '07', 'Perform', 'Ink pen', 'Draw each path with persistent ink and a persistent random stream.'],
];
export default function Pipeline() {
    return (
        <div className="sg-pipeline">
            <span className="sg-label">The whole system / follow a number into a mark</span>
            <ol>
                {STAGES.map(([id, n, verb, label, description]) => (
                    <li key={id}>
                        <a href={`#${id}`}>
                            <span className="sg-label">
                                {n} / {verb}
                            </span>
                            <strong>{label}</strong>
                            <span>{description}</span>
                            <i aria-hidden="true">↗</i>
                        </a>
                    </li>
                ))}
            </ol>
            <p className="sg-note">Stages 01–06 prepare the drawing once. Stage 07 advances in small batches until the paper is finished.</p>
        </div>
    );
}
