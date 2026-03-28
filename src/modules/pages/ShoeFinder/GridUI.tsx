'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { CONFIG } from './gridConfig';

const islandTransition = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 1 };

type UnifiedControlBarProps = {
    currentCollection: number;
    onSwitch: (index: number) => void;
    setZoomTrigger: (z: number | 'OUT') => void;
    isZoomedIn: boolean;
    hasActiveSelection: boolean;
    nikeFilter: string;
    onFilterChange: (f: string) => void;
};

export function UnifiedControlBar({ currentCollection, onSwitch, setZoomTrigger, isZoomedIn, hasActiveSelection, nikeFilter, onFilterChange }: UnifiedControlBarProps) {
    const collections = ['Nike', 'New Balance', 'Under $150'];
    const nikeFilters = [
        { id: 'all', label: 'All' },
        { id: 'jordan', label: 'Jordan' },
        { id: 'dunk', label: 'Dunk' },
    ];

    return (
        <div
            className="sf-control-bar-container"
            style={{ position: 'fixed', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 100, pointerEvents: 'none' }}
        >
            <motion.div
                className="sf-control-bar-island"
                layout
                transition={islandTransition}
                style={{
                    background: 'linear-gradient(135deg, rgba(255,240,235,0.4) 0%, rgba(255,255,255,0.3) 50%, rgba(245,235,255,0.4) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    borderRadius: 32,
                    border: '1px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                    padding: 6,
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'auto',
                    height: 56,
                    overflow: 'hidden',
                }}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {hasActiveSelection ? (
                        <motion.button
                            key="buy-now"
                            initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                            transition={{ ...islandTransition, opacity: { duration: 0.2 } }}
                            style={{
                                background: '#000',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 24,
                                padding: '0 24px',
                                height: 44,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                whiteSpace: 'nowrap',
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Buy Now
                        </motion.button>
                    ) : isZoomedIn ? (
                        <motion.div
                            key="compact"
                            initial={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                            transition={{ ...islandTransition, opacity: { duration: 0.2 } }}
                        >
                            <ControlButton icon="remove" onClick={() => setZoomTrigger('OUT')} label="Zoom Out" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                            transition={{ ...islandTransition, opacity: { duration: 0.2 } }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <ControlButton icon="add" onClick={() => setZoomTrigger(CONFIG.zoomIn)} label="Zoom In" />
                            <motion.div
                                layout
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 24 }}
                                transition={{ delay: 0.1 }}
                                style={{ width: 1, background: 'rgba(0,0,0,0.08)', margin: '0 2px', boxShadow: '0 0 1px rgba(255,255,255,0.3)' }}
                            />
                            <div style={{ display: 'flex', gap: 2 }}>
                                {collections.map((name, idx) => (
                                    <TabButton key={name} isActive={currentCollection === idx} onClick={() => onSwitch(idx)}>
                                        {name}
                                    </TabButton>
                                ))}
                            </div>
                            {currentCollection === 0 && (
                                <div className="sf-desktop-filters" style={{ display: 'flex', alignItems: 'center' }}>
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scaleX: 0 }}
                                        animate={{ opacity: 1, scaleX: 1 }}
                                        transition={islandTransition}
                                        style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.08)', margin: '0 6px', transformOrigin: 'center' }}
                                    />
                                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={islandTransition} style={{ display: 'flex', gap: 4 }}>
                                        {nikeFilters.map((f) => (
                                            <FilterChip key={f.id} isActive={nikeFilter === f.id} onClick={() => onFilterChange(f.id)} layoutGroup="desktop">
                                                {f.label}
                                            </FilterChip>
                                        ))}
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Mobile Nike Filters */}
            <AnimatePresence>
                {currentCollection === 0 && !isZoomedIn && !hasActiveSelection && (
                    <motion.div
                        className="sf-mobile-filters"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={islandTransition}
                        style={{ position: 'absolute', bottom: 70, left: 0, right: 0, display: 'none', justifyContent: 'center', pointerEvents: 'none' }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.85)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                                borderRadius: 20,
                                border: '1px solid rgba(255,255,255,0.3)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                padding: '6px 8px',
                                gap: 4,
                                pointerEvents: 'auto',
                            }}
                        >
                            {nikeFilters.map((f) => (
                                <FilterChip key={`m-${f.id}`} isActive={nikeFilter === f.id} onClick={() => onFilterChange(f.id)} layoutGroup="mobile">
                                    {f.label}
                                </FilterChip>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .sf-mobile-filters { display: none !important; }
                @media (max-height: 800px) { .sf-control-bar-container { bottom: 24px !important; } .sf-control-bar-island { height: 48px !important; border-radius: 24px !important; padding: 4px !important; } }
                @media (max-height: 650px) { .sf-control-bar-container { bottom: 16px !important; } .sf-control-bar-island { height: 44px !important; } }
                @media (max-width: 768px) { .sf-control-bar-container { bottom: 20px !important; } .sf-control-bar-island { height: 48px !important; padding: 4px !important; } .sf-desktop-filters { display: none !important; } .sf-mobile-filters { display: flex !important; } }
                @media (max-width: 480px) { .sf-control-bar-container { bottom: 16px !important; } .sf-control-bar-island { height: 44px !important; } .sf-mobile-filters { bottom: 60px !important; } }
            `}</style>
        </div>
    );
}

function ControlButton({ onClick, icon, label }: { onClick: () => void; icon: 'add' | 'remove'; label: string }) {
    return (
        <motion.button
            layout="position"
            onClick={onClick}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.05)' }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                color: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
            }}
            aria-label={label}
        >
            {icon === 'add' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            )}
        </motion.button>
    );
}

function TabButton({ children, isActive, onClick }: { children: React.ReactNode; isActive: boolean; onClick: () => void }) {
    return (
        <motion.button
            layout
            onClick={onClick}
            style={{
                position: 'relative',
                border: 'none',
                background: 'transparent',
                color: isActive ? '#000' : '#666',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                zIndex: 1,
                transition: 'color 0.2s ease',
            }}
        >
            {children}
            {isActive && (
                <motion.div
                    layoutId="sf-activeTab"
                    transition={islandTransition}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.4)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
                        zIndex: -1,
                    }}
                />
            )}
        </motion.button>
    );
}

function FilterChip({ children, isActive, onClick, layoutGroup }: { children: React.ReactNode; isActive: boolean; onClick: () => void; layoutGroup: string }) {
    return (
        <motion.button
            layout
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={islandTransition}
            style={{
                position: 'relative',
                border: 'none',
                background: 'transparent',
                color: isActive ? '#fff' : '#555',
                padding: '6px 12px',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                zIndex: 1,
            }}
        >
            {isActive && (
                <motion.div
                    layoutId={`sf-activeFilter-${layoutGroup}`}
                    transition={islandTransition}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', borderRadius: 14, zIndex: -1 }}
                />
            )}
            {!isActive && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.05)', borderRadius: 14, zIndex: -1 }} />}
            {children}
        </motion.button>
    );
}
