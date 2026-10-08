import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Floema, explained — A designer’s guide to creative development',
    description: 'Learn every Floema interaction through concise explanations, adjustable demos, source excerpts, and creative experiments.',
};
export default function LearnLayout({ children }: { children: ReactNode }) {
    return children;
}
