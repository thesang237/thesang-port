'use client';

import { motion } from 'framer-motion';

import { MotionDiv, slideInRight, staggerContainer } from '@/components/animation/motion';
import MotionLines from '@/components/animation/Typo/Lines';

const cards = [
    {
        title: 'Creative Vision',
        desc: 'Translating complex ideas into immersive digital experiences with pixel-perfect precision.',
        icon: '✦',
    },
    {
        title: 'Performance First',
        desc: 'Every animation tuned, every asset optimized. Lighthouse 90+ is the baseline, not the goal.',
        icon: '⚡',
    },
    {
        title: 'Modern Stack',
        desc: 'Next.js App Router, Tailwind, GSAP, Three.js — the full creative-developer toolkit.',
        icon: '◈',
    },
];

const About = () => {
    return (
        <section id="about" className="py-32 px-8">
            <div className="max-w-6xl mx-auto">
                {/* Label */}
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-16">
                    <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">About</span>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left — text */}
                    <div className="space-y-6">
                        <MotionLines as="h2" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                            Building at the intersection of design and engineering
                        </MotionLines>

                        <MotionLines as="p" className="text-muted-foreground text-lg leading-relaxed" config={{ delayWhenEnter: 0.15 }}>
                            I create high-performance web experiences that push creative boundaries. From fragment-shader backgrounds to GSAP-choreographed reveals, every detail is considered.
                        </MotionLines>
                    </div>

                    {/* Right — stagger cards */}
                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid gap-4">
                        {cards.map((card) => (
                            <MotionDiv key={card.title} variants={slideInRight} className="group p-6 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-colors duration-300">
                                <div className="flex items-start gap-4">
                                    <span className="text-2xl">{card.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-card-foreground mb-1">{card.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                                    </div>
                                </div>
                            </MotionDiv>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
