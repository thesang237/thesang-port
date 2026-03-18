'use client';

import { useEffect, useRef, useState } from 'react';

import useWindowScreen from './useWindowScreen';

const useMobileTooltip = () => {
    const { isLaptop } = useWindowScreen();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const openTooltip = () => {
        setIsOpen(true);
    };

    const closeTooltip = () => {
        setIsOpen(false);
    };

    const toggleTooltip = () => {
        setIsOpen((prev) => !prev);
    };

    // Close tooltip when clicking outside on mobile
    useEffect(() => {
        if (isLaptop || !isOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            const isClickOnTrigger = triggerRef.current?.contains(target);
            const isClickOnContent = contentRef.current?.contains(target);

            if (!isClickOnTrigger && !isClickOnContent) {
                closeTooltip();
            }
        };

        // Add event listeners for both mouse and touch events
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isLaptop, isOpen, closeTooltip]);

    // Close tooltip on escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeTooltip();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeTooltip]);

    return {
        isOpen,
        isMobile: !isLaptop,
        openTooltip,
        closeTooltip,
        toggleTooltip,
        triggerRef,
        contentRef,
    };
};

export default useMobileTooltip;
