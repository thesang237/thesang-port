'use client';

import type { JSX } from 'react';
import { Fragment, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import type { BundledLanguage } from 'shiki/bundle/web';
import { codeToHast } from 'shiki/bundle/web';

import { cn } from '@/utils/cn';

type CodeBlockProps = {
    children: string;
    /** Shiki language id — defaults to 'tsx' */
    lang?: string;
    /** Lines containing any of these strings get an indigo highlight */
    highlight?: string[];
    className?: string;
    /** Server-pre-rendered JSX — pass from an async Server Component to avoid client flash */
    initial?: JSX.Element;
};

async function highlightCode(code: string, lang: string, highlight?: string[]) {
    const hast = await codeToHast(code, {
        lang: lang as BundledLanguage,
        theme: 'github-dark-dimmed',
        transformers: [
            {
                // Remove Shiki's inline styles so Tailwind classes have full control
                pre(node) {
                    node.properties.style = '';
                },
                // Strip \n text nodes between .line spans — block layout handles line breaks
                code(node) {
                    node.children = node.children.filter((child) => !(child.type === 'text' && child.value === '\n'));
                },
                line(node, line) {
                    if (!highlight?.length) return;
                    const lineText = code.split('\n')[line - 1] ?? '';
                    if (highlight.some((h) => lineText.includes(h))) {
                        const cls = String(node.properties.class ?? '');
                        node.properties.class = `${cls} hl`;
                    }
                },
            },
        ],
    });

    return toJsxRuntime(hast, { Fragment, jsx, jsxs }) as JSX.Element;
}

function CopyButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [code]);

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy code'}
            className="absolute top-3 right-3 z-10 flex items-center justify-center size-8 rounded-md bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 transition-colors backdrop-blur-sm"
        >
            {copied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
            )}
        </button>
    );
}

export function CodeBlock({ children, lang = 'tsx', highlight, className, initial }: CodeBlockProps) {
    const code = useMemo(() => (typeof children === 'string' ? children.trim() : ''), [children]);
    const highlightKey = highlight?.join('\x00') ?? '';
    const [nodes, setNodes] = useState<JSX.Element | undefined>(initial);

    useLayoutEffect(() => {
        if (!code) return;
        void highlightCode(code, lang, highlight).then(setNodes);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, lang, highlightKey]);

    if (!nodes) {
        return (
            <div className={cn('relative group', className)}>
                <CopyButton code={code} />
                <pre className="bg-[#0d0d12] border border-zinc-800 rounded-xl p-6 font-mono overflow-x-auto leading-relaxed text-[#adbac7]" style={{ fontSize: '14px' }}>
                    {code}
                </pre>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'relative group',
                'bg-[#0d0d12] p-6 border border-zinc-800 rounded-xl overflow-hidden',
                '[&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:m-0 [&_pre]:leading-relaxed [&_pre]:overflow-x-auto',
                '[&_.line]:block',
                '[&_.hl]:-mx-6 [&_.hl]:px-6 [&_.hl]:bg-indigo-500/10',
                className,
            )}
            style={{ fontSize: '14px' }}
        >
            <CopyButton code={code} />
            {nodes}
        </div>
    );
}
