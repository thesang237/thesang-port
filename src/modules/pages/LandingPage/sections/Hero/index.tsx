'use client';

import dynamic from 'next/dynamic';

import MotionCharsInLines from '@/components/animation/Typo/CharsInLines';

const HeroBackground = dynamic(() => import('./HeroBackground'), { ssr: false });

const Hero = () => {
    return (
        <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* R3F canvas background */}
            <div className="absolute inset-0 z-0">
                <HeroBackground />
            </div>

            {/* Noise overlay */}
            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px',
                    opacity: 0.5,
                }}
            />

            {/* Content */}
            <div className="relative z-[2] flex flex-col items-center text-center px-8 max-w-6xl">
                <div className="mb-6">
                    <span className="inline-block text-xs font-medium tracking-[0.3em] uppercase text-white/50 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                        Creative Developer · 2026
                    </span>
                </div>

                <MotionCharsInLines as="h1" className="text-5xl sm:text-7xl lg:text-[8vw] font-bold text-white leading-[1.05] tracking-tight" config={{ delayWhenEnter: 0.3 }}>
                    Crafting Digital
                </MotionCharsInLines>

                <MotionCharsInLines
                    as="h1"
                    className="text-5xl sm:text-7xl lg:text-[8vw] font-bold leading-[1.05] tracking-tight"
                    style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}
                    config={{ delayWhenEnter: 0.5 }}
                >
                    Experiences
                </MotionCharsInLines>

                <p className="mt-8 text-base sm:text-lg text-white/50 max-w-xl leading-relaxed">Next.js · GSAP · Three.js · Framer Motion</p>

                <div className="mt-12 flex items-center gap-6">
                    <a href="#work" className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
                        View Work
                    </a>
                    <a href="#contact" className="px-6 py-3 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                        Get in Touch
                    </a>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-2">
                <span className="text-white/30 text-xs tracking-widest uppercase">Scroll</span>
                <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" />
            </div>
        </section>
    );
};

export default Hero;
