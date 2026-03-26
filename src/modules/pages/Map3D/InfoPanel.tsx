'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

import { DAYS, type PointInfo } from './data';

type Props = {
    point: PointInfo | null;
    onClose: () => void;
};

export function InfoPanel({ point, onClose }: Props) {
    const contentRef = useRef<HTMLDivElement>(null);

    // Reset scroll to top when a new point opens
    useEffect(() => {
        if (point && contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [point?.id]);

    const isOpen = point !== null;

    return (
        <div
            className="fixed top-0 right-0 h-[100dvh] w-full sm:w-1/3 sm:max-w-[700px] bg-white text-[#041676] z-[100] transition-transform duration-300 ease-in-out flex flex-col"
            style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        >
            {/* Sticky header with close button */}
            <div className="sticky top-0 bg-white z-10 flex justify-end px-5 py-4 shrink-0">
                <button onClick={onClose} aria-label="Close" className="cursor-pointer p-1 hover:opacity-60 transition-opacity">
                    <Image src="/3d-map/images/icn-close.svg" alt="Close" width={24} height={24} />
                </button>
            </div>

            {/* Scrollable content */}
            <div ref={contentRef} className="overflow-y-auto flex-1 pb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#041676 #d6d2ca' }}>
                {point && (
                    <div className="px-5">
                        {/* Photo */}
                        <div className="relative w-full aspect-video mb-5 mt-2">
                            <Image src={point.image} alt={point.title} fill className="object-cover" />
                        </div>

                        {/* Logo */}
                        <div className="mb-5">
                            <Image src={point.logo} alt={point.title} width={160} height={60} className="object-contain object-left max-h-[60px] w-auto" />
                        </div>

                        {/* Title */}
                        <h2 className="text-[2rem] leading-[2.2rem] font-bold mb-5">{point.title}</h2>

                        {/* Lead */}
                        <p className="font-bold mb-5 leading-6">{point.lead}</p>

                        {/* Description */}
                        <p className="mb-8 leading-6" dangerouslySetInnerHTML={{ __html: point.description }} />

                        {/* Schedule table */}
                        <table className="w-full border border-[#041676] border-collapse mb-6">
                            <caption className="text-left text-2xl mb-4">Schedule</caption>
                            <thead>
                                <tr className="border border-[#041676]">
                                    <th className="p-4 text-left w-[35%]">Days</th>
                                    <th className="p-4 text-left">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map((day, i) => (
                                    <tr key={day} className="border border-[#041676]">
                                        <td className="p-4 w-[35%]">{day}</td>
                                        <td className="p-4">{point.schedule[i]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Contact table */}
                        <table className="w-full border border-[#041676] border-collapse mb-6">
                            <caption className="text-left text-2xl mb-4">Contact</caption>
                            <tbody>
                                <tr className="border border-[#041676]">
                                    <th className="p-4 text-left w-[35%] font-normal">Phone</th>
                                    <td className="p-4">{point.phone}</td>
                                </tr>
                                <tr className="border border-[#041676]">
                                    <th className="p-4 text-left w-[35%] font-normal">Email</th>
                                    <td className="p-4">{point.email}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Website button */}
                        <a href={point.website} target="_blank" rel="noopener noreferrer" className="block border-0">
                            <button className="w-full py-4 px-8 bg-[#041676] text-white border border-[#041676] text-lg cursor-pointer transition-colors duration-300 hover:bg-white hover:text-[#041676]">
                                Visit website
                            </button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
