'use client';

import { motion } from 'framer-motion';

import { fadeInUp, MotionDiv, staggerContainerFast } from '@/components/animation/motion';

const technologies = [
    { name: 'Next.js 16', category: 'Framework' },
    { name: 'React 19', category: 'UI' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'GSAP', category: 'Animation' },
    { name: 'Framer Motion', category: 'Animation' },
    { name: 'Three.js', category: '3D' },
    { name: 'React Three Fiber', category: '3D' },
    { name: 'Lenis', category: 'Scroll' },
    { name: 'Zustand', category: 'State' },
    { name: 'React Query', category: 'Data' },
    { name: 'next-intl', category: 'i18n' },
    { name: 'shadcn/ui', category: 'Components' },
    { name: 'Radix UI', category: 'Primitives' },
    { name: 'Zod', category: 'Validation' },
    { name: 'SCSS Modules', category: 'Styling' },
];

const TechStack = () => {
    return (
        <section id="tech" className="py-32 px-8 overflow-hidden">
            <div className="max-w-6xl mx-auto">
                {/* Label */}
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-6">
                    <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">Tech Stack</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-16"
                >
                    The full toolkit
                </motion.h2>

                {/* Badge grid */}
                <motion.div variants={staggerContainerFast} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="flex flex-wrap gap-3">
                    {technologies.map((tech) => (
                        <MotionDiv
                            key={tech.name}
                            variants={fadeInUp}
                            whileHover={{ scale: 1.04, y: -2 }}
                            className="group flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 cursor-default"
                        >
                            <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">{tech.category}</span>
                            <div className="w-px h-3 bg-border" />
                            <span className="text-sm font-medium text-card-foreground">{tech.name}</span>
                        </MotionDiv>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default TechStack;
