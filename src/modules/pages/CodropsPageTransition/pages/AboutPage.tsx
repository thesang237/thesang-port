import NavLink from '../components/NavLink';

export default function AboutPage() {
    return (
        <section className="hero" data-namespace="about">
            <div className="hero_content">
                <div className="links_codrops">
                    <NavLink href="https://tympanus.net/codrops/?p=109206" external>
                        TUTORIAL
                    </NavLink>
                    <NavLink href="https://tympanus.net/codrops/hub/" external>
                        MORE DEMOS
                    </NavLink>
                </div>

                <div className="lists_c">
                    <ul>
                        <li>
                            <div className="lines">
                                <div className="inner_lines inner_linesleft" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p">NAME</p>
                            <p className="anim_p">Flower Still Life with a Timepiece</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesleft" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p">ARTIST</p>
                            <p className="anim_p">Willem van Aelst</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesleft" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p">DATE</p>
                            <p className="anim_p">1663</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesleft" />
                            </div>
                        </li>
                    </ul>

                    <ul>
                        <li className="desktop">
                            <div className="lines desktop">
                                <div className="inner_lines inner_linesright" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p2">LOCATION</p>
                            <p className="anim_p2">Mauritshuis, La Haye</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesright" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p2">STYLE</p>
                            <p className="anim_p2">Baroque</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesright" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p2">DIMENSIONS</p>
                            <p className="anim_p2">62,5 × 49 cm</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesright" />
                            </div>
                        </li>
                    </ul>
                </div>

                <h1 className="about_title">WV.663</h1>
            </div>
        </section>
    );
}
