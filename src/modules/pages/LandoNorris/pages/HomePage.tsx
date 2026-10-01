'use client';

import Footer from '../sections/Footer';
import Gallery from '../sections/Gallery';
import Helmets from '../sections/Helmets';
import HeroSequence from '../sections/HeroSequence';
import Manifesto from '../sections/Manifesto';
import OnOffTrack from '../sections/OnOffTrack';
import Partners from '../sections/Partners';
import Socials from '../sections/Socials';
import Store from '../sections/Store';

export default function HomePage() {
    return (
        <main className="ln-home">
            <HeroSequence />
            <Manifesto />
            <Gallery />
            <OnOffTrack />
            <Helmets />
            <Store />
            <Partners />
            <Socials />
            <Footer />
        </main>
    );
}
