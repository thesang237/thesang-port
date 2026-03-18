'use client';

import type { ChangeEvent, DragEvent, FC, HTMLAttributes, ReactElement } from 'react';
import { useMemo, useRef, useState } from 'react';

import { isEmpty } from '@/utils/data';

type ChildrenProps = {
    onClick: () => void;
    previewUrls?: string[];
};

type Props = {
    name?: string;
    maxFiles?: number;
    initialValue?: File[];
    onChange?: (file: File[] | null) => void;
    rootProps?: HTMLAttributes<HTMLDivElement>;
    children?: ((props: ChildrenProps) => ReactElement) | ReactElement;
};

const FileDropZone: FC<Props> = ({ name, maxFiles = 1, initialValue, onChange, rootProps, children }) => {
    const [files, setFiles] = useState<File[]>(initialValue ? (Array.isArray(initialValue) ? initialValue : [initialValue]) : []);
    const ref = useRef<HTMLInputElement>(null);

    const previewUrls = useMemo(() => {
        if (!isEmpty(files)) {
            return files.map((file) => URL.createObjectURL(file));
        }
        return [];
    }, [files]);

    const updateFiles = (fileList: FileList) => {
        const processedFiles = Array.from(fileList).slice(0, maxFiles);

        if (!isEmpty(processedFiles)) {
            setFiles(processedFiles);
            onChange?.(processedFiles);
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            updateFiles(event.target.files);
        }
    };

    const handleClick = () => {
        ref.current?.click();
    };

    const childrenProps = useMemo(() => ({ onClick: handleClick, previewUrls }), [handleClick, previewUrls]);

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const files = event.dataTransfer.files;
        if (files) {
            updateFiles(files);
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} {...rootProps}>
            <input hidden ref={ref} name={name} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

            {/* eslint-disable-next-line react-hooks/refs */}
            {typeof children === 'function' ? children(childrenProps) : children}
        </div>
    );
};

export default FileDropZone;
