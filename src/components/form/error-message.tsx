import type { FC } from 'react';

type Props = {
    message: string;
};

const ErrorMessage: FC<Props> = ({ message }) => {
    return <p className="text-sm text-destructive mt-1">{message}</p>;
};

export default ErrorMessage;
