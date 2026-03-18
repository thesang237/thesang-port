'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { fadeInUp, MotionDiv, staggerContainer } from '@/components/animation/motion';
import { cn } from '@/utils/cn';

const Contact = () => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // Simulate async submit
        await new Promise((r) => setTimeout(r, 1000));

        toast.success('Message sent!', {
            description: "I'll get back to you within 48 hours.",
        });

        (e.target as HTMLFormElement).reset();
        setLoading(false);
    };

    return (
        <section id="contact" className="py-32 px-8">
            <div className="max-w-2xl mx-auto">
                {/* Label */}
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-6">
                    <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">Contact</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4"
                >
                    Let&apos;s build something
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-muted-foreground text-lg mb-12"
                >
                    Have a project in mind? Drop a message and let&apos;s talk.
                </motion.p>

                <motion.form variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} onSubmit={handleSubmit} className="space-y-6">
                    <MotionDiv variants={fadeInUp} className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">Name</label>
                            <input
                                name="name"
                                required
                                placeholder="Your name"
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                            />
                        </div>
                    </MotionDiv>

                    <MotionDiv variants={fadeInUp}>
                        <label className="text-sm font-medium text-foreground block mb-2">Message</label>
                        <textarea
                            name="message"
                            required
                            rows={5}
                            placeholder="Tell me about your project..."
                            className="flex w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-colors"
                        />
                    </MotionDiv>

                    <MotionDiv variants={fadeInUp}>
                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                'w-full h-11 rounded-lg font-medium text-sm transition-all duration-200',
                                'bg-foreground text-background hover:opacity-90',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                            )}
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </MotionDiv>
                </motion.form>
            </div>
        </section>
    );
};

export default Contact;
