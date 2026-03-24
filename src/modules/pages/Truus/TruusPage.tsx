'use client';

import TruusCursorBubble from './TruusCursorBubble';
import TruusDoubleMarquee from './TruusDoubleMarquee';
import TruusFooter from './TruusFooter';
import TruusHorizontalWords from './TruusHorizontalWords';
import TruusMotionCards from './TruusMotionCards';
import TruusNavbar from './TruusNavbar';
import TruusServiceCards from './TruusServiceCards';
import TruusShowreel from './TruusShowreel';
import TruusSvgSymbols from './TruusSvgSymbols';
import TruusTransitionScribble from './TruusTransitionScribble';
import TruusVimeoHero from './TruusVimeoHero';

export default function TruusPage() {
    return (
        <div className="truus-root">
            <TruusSvgSymbols />
            <TruusCursorBubble />
            <header className="main-header">
                <TruusNavbar />
                <TruusVimeoHero />
            </header>
            <TruusHorizontalWords />
            <main>
                <div className="content-section motion-cards-wrapper">
                    <TruusMotionCards />
                </div>
                <TruusShowreel />
                <div className="content-section service-cards-wrapper">
                    <TruusServiceCards />
                </div>
            </main>
            <section className="Double-marquee">
                <TruusDoubleMarquee />
            </section>
            <footer className="main-footer">
                <TruusFooter />
            </footer>
            <TruusTransitionScribble />
        </div>
    );
}
