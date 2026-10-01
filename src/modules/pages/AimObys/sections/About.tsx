import { ABOUT_PART_1, ABOUT_PART_2, ABOUT_PHONE, NOTES } from '../data';

import UnderlineLink from './UnderlineLink';

type Line = [string, string?, string?];

function Lines({ lines }: { lines: Line[] }) {
    return lines.map(([text, sup, rest], i) => (
        <div key={i} className="aim-about__line" data-aim="about-line">
            <div className="aim-big-text">
                {text}
                {sup && <span className="aim-sup">{sup}</span>}
                {rest}
            </div>
        </div>
    ));
}

export default function About() {
    return (
        <section id="Home-about" className="aim-about">
            {/* desktop / tablet: hand-broken lines that slide up one by one */}
            <div className="aim-about__text aim-desk-flex">
                <div className="aim-about__part aim-about__part--1">
                    <Lines lines={ABOUT_PART_1} />
                </div>
                <div className="aim-about__part">
                    <Lines lines={ABOUT_PART_2} />
                </div>
            </div>
            {/* phones: the same copy as two plain paragraphs */}
            <div className="aim-about__phone aim-mob-flex">
                {ABOUT_PHONE.map((parts, i) => (
                    <div key={i} className={`aim-about__part${i ? '' : ' aim-about__part--1'}`}>
                        <p className="aim-big-text aim-big-text--phone">
                            {parts.map((part, j) =>
                                part.startsWith('[') ? (
                                    <span key={j} className="aim-sup">
                                        {part}
                                    </span>
                                ) : (
                                    part
                                ),
                            )}
                        </p>
                    </div>
                ))}
            </div>
            <div className="aim-about__info">
                <div className="aim-about__grid">
                    {NOTES.map((note) => (
                        <div key={note.text} className="aim-about__note">
                            <p className="aim-t">{note.text}</p>
                            {note.link && <UnderlineLink href={note.link.href} label={note.link.label} />}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
