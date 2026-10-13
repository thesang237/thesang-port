'use client';

import { useRef, useState } from 'react';

import ConnectedPills from './ConnectedPills';
import { asset } from './data';
import { Arrow, RouteLink, useFloema } from './Shell';

export function PillButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick: () => void; className?: string }) {
    const root = useRef<HTMLButtonElement>(null);
    return (
        <button ref={root} className={`f2-pill-button ${className}`} onClick={onClick}>
            <span className="f2-pill-icon">
                <Arrow />
            </span>
            <span className="f2-pill-label">{children}</span>
            <ConnectedPills rootRef={root} selector=":scope > span" />
        </button>
    );
}

export function Pillars({ sustainability = false }: { sustainability?: boolean }) {
    const entries = sustainability
        ? [
              ['pillar-materials.webp', 'Sustainable materials', 'Selected for lasting usefulness, with care for the resources we share.'],
              ['pillar-integration.webp', 'Integration into spaces', 'Objects that belong to their surroundings, quietly improving everyday life.'],
              ['pillar-replace.webp', 'Easy component replacement', 'Thoughtful construction makes maintenance simpler and extends every life.'],
          ]
        : [
              ['design.webp', 'We design', 'Purposeful ideas, shaped around real people and places.'],
              ['build.webp', 'We build', 'Bringing craft, care, and precision to every detail.'],
              ['implement.webp', 'We implement', 'Made to endure, with a lighter impact on our surroundings.'],
          ];
    return (
        <section className="f2-pillars" data-tone="paper">
            <div className="f2-section-label">
                Our three pillars <span>↓</span>
            </div>
            <div className="f2-pillar-grid">
                {entries.map(([image, title, text]) => (
                    <article key={title} data-reveal>
                        <div className="f2-image-crop">
                            <img src={asset(image)} alt={title} loading="lazy" />
                        </div>
                        <div className="f2-pillar-caption">
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export function Footer({ sustainability = false }: { sustainability?: boolean }) {
    const { openPanel, scrollTo } = useFloema();
    const [submitted, setSubmitted] = useState(false);
    return (
        <>
            <section className="f2-newsletter" data-tone="paper">
                <h2 data-reveal>
                    {sustainability ? (
                        <>
                            Designed with intention
                            <br />— to keep the
                            <br />
                            environment on our side.
                        </>
                    ) : (
                        <>
                            Made to last, designed to
                            <br />
                            endure.
                        </>
                    )}
                </h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        try {
                            localStorage.setItem('floema-two-newsletter', JSON.stringify({ email: data.get('email'), date: new Date().toISOString() }));
                        } catch {
                            /* The form still confirms without persistence. */
                        }
                        setSubmitted(true);
                    }}
                >
                    <label htmlFor="f2-newsletter-email">
                        Join our community
                        <br />A few considered updates, from time to time.
                    </label>
                    <div className="f2-email-row">
                        <input id="f2-newsletter-email" type="email" name="email" placeholder="Your email *" required autoComplete="email" />
                        <button type="submit" aria-label="Sign up">
                            <Arrow />
                        </button>
                    </div>
                    <div className="f2-consent">
                        <input id="f2-consent" type="checkbox" required />
                        <label htmlFor="f2-consent">I agree to the </label>
                        <button type="button" onClick={() => openPanel({ type: 'privacy' })}>
                            Privacy Policy.
                        </button>
                    </div>
                    {submitted && (
                        <p role="status" className="f2-form-status">
                            Thank you. Your interest is saved in this browser; no email was sent.
                        </p>
                    )}
                </form>
            </section>
            <footer className="f2-footer" data-tone="yellow">
                <div className="f2-footer-symbol">
                    <img src={asset('brand-symbol.svg')} alt="Floema symbol" />
                </div>
                <div className="f2-footer-content">
                    <div className="f2-footer-drawing">
                        <img src={asset('footer-table.svg')} alt="" />
                        <img src={asset('footer-bike.svg')} alt="" />
                    </div>
                    <div className="f2-offices">
                        <div>
                            <h3>Headquarters</h3>
                            <p>
                                Terras Velhas, Alcabideque
                                <br />
                                Condeixa-a-Velha, Portugal
                            </p>
                            <a href="mailto:info@floema.pt">info@floema.pt</a>
                        </div>
                        <div>
                            <h3>Production</h3>
                            <p>
                                Zona Industrial de Condeixa-a-Nova
                                <br />
                                Sebal, Portugal
                            </p>
                        </div>
                        <div>
                            <h3>Floema Spain</h3>
                            <p>
                                San Martin de Borines
                                <br />
                                Asturias, España
                            </p>
                            <a href="mailto:info@floema.es">info@floema.es</a>
                        </div>
                    </div>
                    <div className="f2-footer-lower">
                        <nav aria-label="Footer navigation">
                            <button onClick={() => openPanel({ type: 'products' })}>Products</button>
                            <RouteLink href="/floema-2/home#about">About</RouteLink>
                            <RouteLink href="/floema-2/sustainability">Sustainability</RouteLink>
                            <button onClick={() => openPanel({ type: 'journal' })}>Journal</button>
                        </nav>
                        <div className="f2-footer-policies">
                            <button onClick={() => openPanel({ type: 'privacy' })}>Privacy Policy</button>
                            <button onClick={() => openPanel({ type: 'privacy' })}>Cookie Policy</button>
                            <button onClick={() => scrollTo(0)}>Back to top ↑</button>
                        </div>
                        <img src={asset('footer-fountain.svg')} alt="" />
                    </div>
                    <div className="f2-footer-baseline">
                        <span>Floema®</span>
                        <span>Spaces for people, made for life.</span>
                        <button onClick={() => scrollTo(0)} aria-label="Back to top">
                            ↑
                        </button>
                    </div>
                </div>
            </footer>
        </>
    );
}
