'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useLinkAnimation } from '../hooks/useLinkAnimation';
import { type FloemaPage } from '../store/floemaStore';

type Props = {
    currentPage: FloemaPage;
};

export default function Navigation({ currentPage: _currentPage }: Props) {
    const params = useParams();
    const locale = params.locale as string;
    const navRef = useRef<HTMLElement>(null);

    useLinkAnimation(navRef);

    return (
        <nav className="floema-nav" ref={navRef}>
            <Link href={`/${locale}/floema`} className="floema-nav__link">
                {/* Floema wordmark SVG */}
                <svg className="floema-nav__link__icon" viewBox="0 0 128 20" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <text x="0" y="16" fontFamily="George X" fontSize="16" letterSpacing="2">
                        FLOEMA
                    </text>
                </svg>
            </Link>
            <ul>
                <li className="floema-nav__list__item">
                    <Link href={`/${locale}/floema/about`} className="floema-nav__list__link" data-animation="link">
                        <span>About</span>
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
