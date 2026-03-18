import { useState } from 'react';

type Props = {
    initialValue: boolean;
};

type Return = [boolean, () => void];

const useToggle = ({ initialValue }: Props = { initialValue: false }): Return => {
    const [value, setValue] = useState(initialValue);

    const toggle = () => {
        setValue((prev) => !prev);
    };

    return [value, toggle];
};

export default useToggle;
