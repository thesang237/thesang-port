'use client';

import PaletteBag from '../demos/PaletteBag';
import TraitStats from '../demos/TraitStats';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Traits() {
    return (
        <>
            <ChapterHead
                n="02"
                kicker="Traits & rarity"
                title="Dice with a sense of taste."
                lead={
                    <>
                        A collection needs a family resemblance and a few surprises. Traits are how: named features rolled before anything is drawn, with odds tuned so most pieces feel familiar and a
                        few feel rare.
                    </>
                }
            />

            <Section id="what" n="01 · What a trait is" title="Ten labels, rolled first">
                <P>
                    A <Term k="trait">trait</Term> is a named feature a collector can read off the piece. Solace rolls ten. In this port, seven change the picture; three are rolled so the label
                    matches the original, but not drawn.
                </P>
                <Table
                    head={['Trait', 'Values', 'What it does here']}
                    mono={[1]}
                    rows={[
                        ['Palette', '18 names', 'Paper and ink colours'],
                        ['Dunes', '1, 3, 6, 12, 24, 48, 120', 'How many dunes are placed'],
                        ['Sky', '7 names', 'Only the sky grain’s density (the sky effects are not ported)'],
                        ['Margin', 'None, Narrow, Wide', 'A blank border'],
                        ['Brush', 'Sand, Soft, Grainy', 'Ink opacity (and Grainy doubles the frames)'],
                        ['Dancers', 'true / false', 'Ridges sway in a sine wave'],
                        ['Sandstorm', 'true / false', 'Edges get kicked up and down'],
                        ['Misty', 'true / false', 'When false, busy scenes may stack dunes diagonally'],
                        ['Render · Dusty', '–', 'Rolled for the label only'],
                    ]}
                />
                <KeyIdea>Traits are the piece’s label: rolled first, readable without drawing a single dot.</KeyIdea>
            </Section>

            <Section id="bag" n="02 · Odds from repetition" title="A bag with extra tickets">
                <P>
                    The palette is picked from a <Term k="bag">weighted bag</Term>. Nothing clever: the common list goes in three times, the rare list once. Some common palettes even appear twice in
                    their list. More tickets, more likely.
                </P>
                <PaletteBag />
                <Code file="art/palettes.ts" highlight={['PALETTE_BAG']}>
                    {`// 15 common entries (Weather, Warm and Lamp are listed twice) × 3, plus 6 rare = 51 tickets
export const PALETTE_BAG = [...COMMON_PALETTES, ...COMMON_PALETTES, ...COMMON_PALETTES, ...RARE_PALETTES];

const palette = rand.pick(PALETTE_BAG);   // every ticket equally likely`}
                </Code>
                <Lens>A raffle. Some names hold six tickets, the rare ones hold one. Draw a ticket and you still can’t say which name you’ll get, only how often each wins.</Lens>
                <TryThis items={[<>Force “Polar” on the one-dune seed: the same dune, a cold night.</>, <>Force “Lychee” (pink ink on white): rare palettes change the mood more than the shape.</>]} />
                <KeyIdea>Rarity is just repetition: a palette listed six times is six times as likely as one listed once.</KeyIdea>
            </Section>

            <Section id="ladders" n="03 · Chance ladders" title="One number, many outcomes">
                <P>Other traits use a ladder: roll one number between 0 and 1, then walk down the steps until it fits. The width of each step is its probability. Sky is the clearest example:</P>
                <Code file="art/traits.ts" highlight={['const s = rand.next()']}>
                    {`const s = rand.next();
const sky = s < 0.03 ? 'Tabula'      //  3 %
          : s < 0.14 ? 'Starry'      // 11 %
          : s < 0.20 ? 'Wool'        //  6 %
          : s < 0.35 ? 'Beam'        // 15 %
          : s < 0.60 ? 'Timelapse'   // 25 %
          : s < 0.80 ? 'Whisper'     // 20 %
          :            'Null';       // 20 %`}
                </Code>
                <TraitStats />
                <TryThis
                    items={[
                        <>Roll only 200 seeds a few times: the bars jump around. That’s why one mint can feel “rarer” than the odds say.</>,
                        <>Roll 20,000: the bars settle onto the rust ticks.</>,
                    ]}
                />
                <KeyIdea>A ladder turns one random number into a choice: each step’s width is its odds.</KeyIdea>
            </Section>

            <Section id="depend" n="04 · Traits that depend on each other" title="Rules between the dice">
                <P>Good trait systems have rules, so impossible or ugly combinations never happen:</P>
                <Table
                    head={['Rule', 'Why']}
                    rows={[
                        ['Dancers only with 6+ dunes (then 3 %)', 'A single swaying dune looks like a mistake; a swaying range looks like wind'],
                        ['Sandstorm odds grow with the dune count (0 → 4 → 12 %)', 'Scattered edges read better across many dunes'],
                        ['Soft brush only on palettes with canSoft', 'Faint ink on a dark or saturated paper would vanish'],
                        ['Grainy brush never with the Tabula sky', 'Two heavy textures would fight'],
                        ['Render is always Simple for 24+ dunes', 'Fancy render modes get too busy'],
                    ]}
                />
                <Code file="art/traits.ts" highlight={['dunes >= 6', 'sandstormOdds']}>
                    {`const dancers = dunes >= 6 && rand.chance(0.03);
const sandstormOdds = dunes >= 12 ? 0.12 : dunes >= 3 ? 0.04 : 0;
const sandstorm = rand.chance(sandstormOdds);`}
                </Code>
                <Callout tone="warn">
                    Look at <C>{`dunes >= 6 && rand.chance(0.03)`}</C>: when the dune count is under 6, <C>chance</C> is never called, so no number is taken. Conditions change how many numbers a seed
                    uses. That is the one rule from chapter 01 again.
                </Callout>
                <KeyIdea>Rules between traits keep the dice tasteful: some features are only allowed when they look good.</KeyIdea>
            </Section>

            <Section id="override" n="05 · Forcing a trait" title="What if this seed had rolled…">
                <P>
                    The debug panel (press <C>D</C> on /art-solace) can force any trait. Trait overrides are applied <em>before</em> the scene is rolled, so forcing “Dunes: 24” shows “this seed, had
                    it rolled 24 dunes”: the layout reshuffles, because more dunes take more random numbers. Number overrides (warp, densities…) are applied <em>after</em>, so they never move anything
                    else.
                </P>
                <Code file="art/scene.ts" highlight={['overrides.traits']}>
                    {`const traits = { ...rollTraits(traitRand), ...overrides.traits };  // before: may reshuffle
const params = rollSceneParams(rand, traits, palette, overrides.params); // after: replaces only`}
                </Code>
                <KeyIdea>Force a trait to ask “what if the seed had rolled this”; force a number to change only that number.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/traits.ts', note: 'rollTraits' },
                        { path: 'art/palettes.ts', note: 'the bag' },
                        { path: 'debug/DebugPanel.tsx', note: 'overrides' },
                    ]}
                />
            </Section>
        </>
    );
}
