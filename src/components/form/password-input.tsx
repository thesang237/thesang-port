'use client';

import type { FC } from 'react';

import InputBase from '@/components/form/input';
import SvgImage from '@/components/ui/svg-image';
import useToggle from '@/hooks/useToggle';

type Props = {
    name?: string;
    placeholder?: string;
    autoComplete?: string;
};

const PasswordInput: FC<Props> = ({ name, placeholder, autoComplete }) => {
    const [isShowPassword, toggleShowPassword] = useToggle();

    return (
        <div className="relative">
            <InputBase name={name} placeholder={placeholder} type={isShowPassword ? 'text' : 'password'} className="w-full" autoComplete={autoComplete} />
            <div className="absolute top-0 bottom-0 right-6 my-auto w-8 h-8 aspect-square cursor-pointer [&_img]:w-full [&_img]:h-full" onClick={toggleShowPassword}>
                <SvgImage fill src={isShowPassword ? '/icons/password-closed.svg' : '/icons/password-open.svg'} alt={isShowPassword ? 'Hide password' : 'Show password'} />
            </div>
        </div>
    );
};

export default PasswordInput;
