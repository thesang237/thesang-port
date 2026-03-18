'use client';

import { type FC, type MouseEvent, type ReactNode } from 'react';
import type { LinkProps } from 'next/link';

import { Link, usePathname } from '@/i18n/navigation';
import { usePage } from '@/providers/page';

type Props = Omit<LinkProps, 'href' | 'prefetch' | 'locale' | 'as'> & {
    href: string;
    children: ReactNode;
};

const TransitionLink: FC<Props> = ({ href, children, onClick, ...props }) => {
    const pathname = usePathname();

    const { navigate } = usePage();

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);

        if (pathname === href) {
            window.location.reload();
            return;
        }

        // Allow external links to work normally
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        if (e.defaultPrevented) {
            return;
        }

        e.preventDefault();

        navigate({ pathname: href });
    };

    return (
        <Link href={href} onClick={handleClick} {...props}>
            {children}
        </Link>
    );
};

export default TransitionLink;
