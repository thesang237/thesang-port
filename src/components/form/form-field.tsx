import type { FC, ReactNode } from 'react';

import ErrorMessage from '@/components/form/error-message';

type Props = {
    label: string;
    required?: boolean;
    errorMessage?: string;
    children: ReactNode;
};

const FormField: FC<Props> = ({ label, required = false, errorMessage = '', children }) => {
    return (
        <div className="flex flex-col flex-1">
            <label className="text-sm font-medium mb-1">
                {label} {required && <span className="text-destructive">*</span>}
            </label>

            <div className="flex flex-col w-full h-full">
                {children}
                {errorMessage && <ErrorMessage message={errorMessage} />}
            </div>
        </div>
    );
};

export default FormField;
