'use client';

import s from './roadmap.module.css';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AI_TOOLS, DAILY_ROUTINE, DEFINITION_OF_DONE, KPIS, LEVERAGE, ONGOING_PROJECTS, type PanelKey, PHASES, TASK_META, type TaskType, WARNINGS, type Week, WEEKS } from './data';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const STORAGE_KEY = 'roadmap-completed';

function pct(done: number, total: number): string {
    return total > 0 ? `${(done / total) * 100}%` : '0%';
}

function taskColorVar(type: TaskType): { bg: string; fg: string } {
    const map: Record<TaskType, { bg: string; fg: string }> = {
        build: { bg: '#6ee7b715', fg: '#6ee7b7' },
        learn: { bg: '#c4b5fd15', fg: '#c4b5fd' },
        study: { bg: '#fbbf2415', fg: '#fbbf24' },
    };
    return map[type];
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function RoadmapPage() {
    const [activeWeek, setActiveWeek] = useState(1);
    const [completed, setCompleted] = useState<Record<string, boolean>>({});
    const [panel, setPanel] = useState<PanelKey>('roadmap');
    const [hydrated, setHydrated] = useState(false);

    // Load from localStorage after mount (setState in effect is intentional here for SSR hydration safety)

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (saved) setCompleted(JSON.parse(saved));
        } catch {
            // ignore parse errors
        }
        setHydrated(true);
    }, []);

    // Persist to localStorage on every change
    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
        } catch {
            // ignore quota errors
        }
    }, [completed, hydrated]);

    const toggle = useCallback((week: number, idx: number) => {
        const key = `${week}-${idx}`;
        setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const week = useMemo(() => WEEKS.find((w) => w.week === activeWeek)!, [activeWeek]);

    const weekDone = useMemo(() => week.tasks.filter((_, i) => completed[`${activeWeek}-${i}`]).length, [week, activeWeek, completed]);

    const globalTotal = useMemo(() => WEEKS.reduce((sum, w) => sum + w.tasks.length, 0), []);
    const globalDone = useMemo(() => Object.values(completed).filter(Boolean).length, [completed]);

    // ── Render ──────────────────────────────

    return (
        <div className={s.page}>
            {/* Header */}
            <header className={s.header}>
                <p className={s.headerLabel}>12 TUẦN • UX/UI DESIGNER → DESIGN ENGINEER</p>
                <h1 className={s.headerTitle}>Combined Roadmap</h1>
                <p className={s.headerSub}>Bắt đầu: 17/03/2026 • Xuất phát: HTML/CSS/JS, React/Next.js, GSAP/Three.js cơ bản, UX/UI background</p>

                <div className={s.globalProgress}>
                    <div className={s.progressTrack}>
                        <div className={s.progressFill} style={{ width: pct(globalDone, globalTotal) }} />
                    </div>
                    <span className={s.progressText}>
                        {globalDone}/{globalTotal} tasks
                    </span>
                </div>
            </header>

            {/* Ongoing Projects */}
            {ONGOING_PROJECTS.map((p) => (
                <div key={p.name} className={s.ongoingBanner} style={{ background: `${p.color}08`, border: `1px solid ${p.color}25` }}>
                    <span className={s.ongoingEmoji}>🔄</span>
                    <div className={s.ongoingContent}>
                        <div className={s.ongoingName} style={{ color: p.color }}>
                            ONGOING: {p.name}
                        </div>
                        <div className={s.ongoingDesc}>{p.desc}</div>
                    </div>
                    <span className={s.ongoingBadge} style={{ background: `${p.color}20`, color: p.color }}>
                        {p.status.toUpperCase()}
                    </span>
                </div>
            ))}

            {/* Phase Overview */}
            <div className={s.phaseRow}>
                {PHASES.map((p) => (
                    <div key={p.name} className={s.phaseCard} style={{ borderTop: `3px solid ${p.color}` }}>
                        <div className={s.phaseName} style={{ color: p.color }}>
                            {p.name}
                        </div>
                        <div className={s.phaseWeeks}>Tuần {p.weeks}</div>
                        <div className={s.phaseDesc}>{p.desc}</div>
                    </div>
                ))}
            </div>

            {/* Tab Switcher */}
            <div className={s.tabRow}>
                {(
                    [
                        { key: 'roadmap', label: '📋 Roadmap' },
                        { key: 'kpi', label: '📊 KPIs' },
                        { key: 'routine', label: '⏰ Daily Routine' },
                    ] as const
                ).map((t) => (
                    <button key={t.key} className={`${s.tab} ${panel === t.key ? s.tabActive : s.tabInactive}`} onClick={() => setPanel(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* KPI Panel */}
            {panel === 'kpi' && (
                <div className={s.panel}>
                    <div className={s.panelTitle}>📊 KPI Theo Dõi Hàng Tuần</div>
                    {KPIS.map((k) => (
                        <div key={k.metric} className={s.kpiRow}>
                            <span className={s.kpiMetric}>{k.metric}</span>
                            <span className={s.kpiTarget}>{k.target}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Daily Routine Panel */}
            {panel === 'routine' && (
                <div className={s.panel}>
                    <div className={s.panelTitle}>⏰ Daily Routine Gợi Ý (~7h productive work/ngày)</div>
                    {DAILY_ROUTINE.map((d) => (
                        <div key={d.time} className={s.routineRow}>
                            <span className={s.routineEmoji}>{d.emoji}</span>
                            <span className={s.routineTime}>{d.time}</span>
                            <span className={s.routineActivity}>{d.activity}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Roadmap Panel */}
            {panel === 'roadmap' && (
                <>
                    {/* Week Selector */}
                    <div className={s.weekSelector}>
                        {WEEKS.map((wk) => {
                            const done = wk.tasks.filter((_, i) => completed[`${wk.week}-${i}`]).length;
                            const active = wk.week === activeWeek;
                            return (
                                <button
                                    key={wk.week}
                                    className={s.weekBtn}
                                    style={{
                                        background: active ? `${wk.phaseColor}15` : '#18181b',
                                        border: active ? `1.5px solid ${wk.phaseColor}60` : '1px solid #27272a',
                                    }}
                                    onClick={() => setActiveWeek(wk.week)}
                                >
                                    <div
                                        className={s.weekMiniBar}
                                        style={{
                                            width: pct(done, wk.tasks.length),
                                            background: wk.phaseColor,
                                        }}
                                    />
                                    <div className={s.weekLabel}>TUẦN</div>
                                    <div className={s.weekNumber} style={{ color: active ? wk.phaseColor : '#71717a' }}>
                                        {wk.week}
                                    </div>
                                    <div className={s.weekCount}>
                                        {done}/{wk.tasks.length}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Week Detail */}
                    <WeekDetail week={week} activeWeek={activeWeek} completed={completed} weekDone={weekDone} onToggle={toggle} />

                    {/* AI Tools */}
                    <div className={s.aiToolsCard}>
                        <div className={s.aiToolsLabel}>🤖 AI TOOLS STRATEGY</div>
                        {AI_TOOLS.map((t) => (
                            <div key={t.tool} className={s.aiToolRow}>
                                <span className={s.aiToolName}>{t.tool}</span>
                                <span className={s.aiToolUse}>{t.use}</span>
                            </div>
                        ))}
                    </div>

                    {/* Leverage + Warnings */}
                    <div className={s.gridTwo}>
                        <div className={s.gridCard}>
                            <div className={s.gridCardLabel} style={{ color: '#fbbf24' }}>
                                💡 LỢI THẾ CỦA BẠN
                            </div>
                            {LEVERAGE.map((item) => (
                                <div key={item} className={s.gridCardItem}>
                                    → {item}
                                </div>
                            ))}
                        </div>
                        <div className={s.gridCard}>
                            <div className={s.gridCardLabel} style={{ color: '#ef4444' }}>
                                ⚠️ SAI LẦM CẦN TRÁNH
                            </div>
                            {WARNINGS.map((item) => (
                                <div key={item} className={s.gridCardItem}>
                                    ✗ {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Definition of Done */}
                    <div className={s.dodCard}>
                        <div className={s.dodLabel}>🎯 DEFINITION OF DONE (SAU 12 TUẦN)</div>
                        {DEFINITION_OF_DONE.map((item) => (
                            <div key={item} className={s.dodItem}>
                                ✓ {item}
                            </div>
                        ))}
                    </div>

                    {/* Quote */}
                    <div className={s.quoteCard}>
                        <div className={s.quoteText}>
                            &ldquo;Design Engineers don&rsquo;t just make things pretty — they ship production-quality interfaces with obsessive attention to detail. Every pixel, every transition,
                            every state.&rdquo;
                        </div>
                        <div className={s.quoteRule}>Rule #1: Mỗi tuần PHẢI ship something. Không ship = không tiến bộ.</div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Sub-component: Week Detail
// ─────────────────────────────────────────────

type WeekDetailProps = {
    week: Week;
    activeWeek: number;
    completed: Record<string, boolean>;
    weekDone: number;
    onToggle: (week: number, idx: number) => void;
};

function WeekDetail({ week: w, activeWeek, completed, weekDone, onToggle }: WeekDetailProps) {
    return (
        <div className={s.weekCard}>
            {/* Header */}
            <div className={s.weekHeader} style={{ background: `linear-gradient(135deg, ${w.phaseColor}06, transparent)` }}>
                <div className={s.weekHeaderMeta}>
                    <span className={s.weekPhaseBadge} style={{ background: `${w.phaseColor}18`, color: w.phaseColor }}>
                        {w.phase}
                    </span>
                    <span className={s.weekHeaderNum}>Tuần {w.week} / 12</span>
                </div>
                <h2 className={s.weekTitle}>{w.title}</h2>
                <p className={s.weekGoal}>🎯 {w.goal}</p>

                <div className={s.weekProgress}>
                    <div className={s.weekProgressTrack}>
                        <div
                            className={s.weekProgressFill}
                            style={{
                                width: pct(weekDone, w.tasks.length),
                                background: w.phaseColor,
                            }}
                        />
                    </div>
                    <span className={s.weekProgressText}>
                        {weekDone}/{w.tasks.length}
                    </span>
                </div>
            </div>

            {/* Tasks */}
            <div className={s.taskList}>
                {w.tasks.map((task, i) => {
                    const key = `${activeWeek}-${i}`;
                    const done = !!completed[key];
                    const meta = TASK_META[task.type];
                    const colors = taskColorVar(task.type);

                    return (
                        <button key={i} className={s.taskBtn} style={{ background: done ? `${w.phaseColor}06` : 'transparent' }} onClick={() => onToggle(activeWeek, i)}>
                            {/* Checkbox */}
                            <div className={done ? s.checkboxChecked : s.checkboxUnchecked} style={done ? { border: `2px solid ${w.phaseColor}`, background: w.phaseColor } : undefined}>
                                {done && <span className={s.checkMark}>✓</span>}
                            </div>

                            {/* Content */}
                            <div className={s.taskContent}>
                                <span className={s.taskTypeBadge} style={{ background: colors.bg, color: colors.fg }}>
                                    {meta.icon} {meta.label}
                                </span>
                                <div className={`${s.taskText} ${done ? s.taskTextDone : s.taskTextUndone}`}>{task.text}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Deliverable */}
            <div className={s.deliverableSection}>
                <div className={s.deliverableLabel}>📦 DELIVERABLE</div>
                <div className={s.deliverableText}>{w.deliverable}</div>
            </div>

            {/* Resources */}
            <div className={s.resourcesSection}>
                <div className={s.resourcesLabel}>📚 RESOURCES</div>
                {w.resources.map((r) => (
                    <div key={r} className={s.resourceItem}>
                        → {r}
                    </div>
                ))}
            </div>
        </div>
    );
}
