'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';

import MotionFade from '@/components/animation/Box/Fade';
import { cn } from '@/utils/cn';

const projects = [
    {
        id: '01',
        title: 'Hologram Interface',
        category: 'WebGL · GLSL · R3F',
        desc: 'Real-time holographic shader with Fresnel rim lighting, animated scanlines, and additive blending.',
        color: 'from-violet-950/40 to-blue-950/40',
        accent: '#70c1ff',
    },
    {
        id: '02',
        title: 'Motion System',
        category: 'GSAP · SplitText',
        desc: 'Typography-first animation system using GSAP SplitText with scroll-triggered orchestration.',
        color: 'from-emerald-950/40 to-teal-950/40',
        accent: '#6ee7b7',
    },
    {
        id: '03',
        title: 'Creative Template',
        category: 'Next.js · Tailwind',
        desc: 'Awwwards-caliber template built for creative studios and developers who demand excellence.',
        color: 'from-rose-950/40 to-orange-950/40',
        accent: '#fda4af',
    },
    {
        id: '04',
        title: 'Smooth Scroll Engine',
        category: 'Lenis · GSAP',
        desc: 'Buttery-smooth scroll experience with pinned sections, parallax layers, and scrub animations.',
        color: 'from-amber-950/40 to-yellow-950/40',
        accent: '#fde68a',
    },
];

const Work = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: 'start',
        dragFree: true,
    });

    const [selectedIndex, setSelectedIndex] = useState(0);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    return (
        <section id="work" className="py-32 overflow-hidden">
            <div className="px-8 max-w-6xl mx-auto mb-16">
                {/* Label */}
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-6">
                    <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">Selected Work</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground"
                >
                    Recent projects
                </motion.h2>
            </div>

            {/* Carousel */}
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4 px-8">
                    {projects.map((project) => (
                        <MotionFade key={project.id} className="flex-none w-[85vw] sm:w-[420px] lg:w-[480px]">
                            <div className={cn('relative h-64 sm:h-80 rounded-2xl border border-border overflow-hidden bg-gradient-to-br', project.color)}>
                                {/* Project number */}
                                <span className="absolute top-6 left-6 text-xs font-mono text-white/30">{project.id}</span>

                                {/* Accent line */}
                                <div className="absolute bottom-0 left-0 h-0.5 w-1/3" style={{ backgroundColor: project.accent }} />

                                {/* Content */}
                                <div className="absolute bottom-6 left-6 right-6">
                                    <p className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: project.accent }}>
                                        {project.category}
                                    </p>
                                    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                                    <p className="text-sm text-white/50 leading-relaxed line-clamp-2">{project.desc}</p>
                                </div>
                            </div>
                        </MotionFade>
                    ))}
                </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8 px-8">
                {projects.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => emblaApi?.scrollTo(i)}
                        className={cn('w-1.5 h-1.5 rounded-full transition-all duration-300', i === selectedIndex ? 'bg-foreground w-6' : 'bg-muted-foreground/30')}
                    />
                ))}
            </div>
        </section>
    );
};

export default Work;
