'use client';
import { createContext, useContext } from 'react';

import type { View } from './data';
import type { SceneState } from './scene';

type Experience = { scene: SceneState; ready: boolean; reduced: boolean; href: (view: View) => string; navigate: (view: View) => void };
export const ExperienceContext = createContext<Experience | null>(null);
export function useFloema() {
    const value = useContext(ExperienceContext);
    if (!value) throw new Error('Floema components require FloemaExperience');
    return value;
}
