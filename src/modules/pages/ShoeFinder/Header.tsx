'use client';

export function ShoeFinderHeader() {
    return (
        <header
            className="site-header-sf"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                padding: '20px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: 'none',
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}
        >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: '#000', textTransform: 'uppercase' }}>PERFECT</span>
                        <span style={{ fontSize: 15, fontWeight: 300, letterSpacing: '0.12em', color: '#000', textTransform: 'uppercase' }}>PAIR</span>
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 400, letterSpacing: '0.2em', color: '#999', textTransform: 'uppercase', marginTop: -1 }}>Est. 2026</span>
                </div>
            </div>

            {/* Nav */}
            <div className="header-nav-sf" style={{ display: 'flex', alignItems: 'center', gap: 24, pointerEvents: 'auto' }}>
                <NavItem label="BROWSE" number="01" />
                <NavItem label="COLLECT" number="02" />
                <div style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.15)' }} />
                <span style={{ fontSize: 11, fontWeight: 400, letterSpacing: '0.05em', color: '#000', opacity: 0.4 }}>&ldquo;FOOTWEAR&rdquo;</span>
            </div>

            <style>{`
                @media (max-width: 600px) {
                    .site-header-sf { padding: 16px 20px !important; }
                    .header-nav-sf { display: none !important; }
                }
            `}</style>
        </header>
    );
}

function NavItem({ label, number }: { label: string; number: string }) {
    return (
        <div
            style={{ display: 'flex', alignItems: 'baseline', gap: 6, cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
            <span style={{ fontSize: 9, fontWeight: 400, color: '#999', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{number}</span>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: '#000', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{label}</span>
        </div>
    );
}
