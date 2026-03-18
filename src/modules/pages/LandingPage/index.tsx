import type { FC } from 'react';

import About from './sections/About';
import Contact from './sections/Contact';
import Hero from './sections/Hero';
import TechStack from './sections/TechStack';
import Work from './sections/Work';

const LandingPage: FC = () => {
    return (
        <main>
            <Hero />
            <About />
            <TechStack />
            <Work />
            <Contact />
        </main>
    );
};

export default LandingPage;
