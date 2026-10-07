import type { LabConfig } from '../demos/PrintLab';

import type { ChapterId } from './chapters';
export type Card = { q: string; a: string };
export type Lesson = {
    id: ChapterId;
    lead: string;
    idea: string;
    lens: string;
    mechanism: string;
    code: string;
    file: string;
    highlight: string[];
    lab: LabConfig;
    tries: string[];
    application: string;
    remembers: [string, string, string, string];
    sources: string[];
};
