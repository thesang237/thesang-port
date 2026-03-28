import NavLink from '../components/NavLink';

export default function HomePage() {
    return (
        <section className="hero" data-namespace="home">
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
                            <p className="anim_p">L&apos;Apothéose d&apos;Hercule</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesleft" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p">ARTIST</p>
                            <p className="anim_p">François Lemoyne</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesleft" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p">DATE</p>
                            <p className="anim_p">1733–1736</p>
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
                            <p className="anim_p2">Château de Versailles</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesright" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p2">STYLE</p>
                            <p className="anim_p2">French baroque</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesright" />
                            </div>
                        </li>
                        <li>
                            <p className="anim_p2">DIMENSIONS</p>
                            <p className="anim_p2">480m²</p>
                            <div className="lines">
                                <div className="inner_lines inner_linesright" />
                            </div>
                        </li>
                    </ul>
                </div>

                <h1 className="home_title">AH.736</h1>
            </div>
        </section>
    );
}
