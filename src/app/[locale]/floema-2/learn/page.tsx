import '@/modules/pages/FloemaTwoLearn/learn.css';

import type { Metadata } from 'next';

import LearnEntry from '@/modules/pages/FloemaTwoLearn/Entry';
export const metadata: Metadata = {
    title: 'Inside the experience — Interactive field guide',
    description: 'Twelve hands-on chapters on scroll choreography, perspective, materials, interaction, and performance.',
};
export default function LearnPage() {
    return <LearnEntry />;
}
