import type { FC, HTMLAttributes, ReactNode } from 'react';
import Scrollbars from 'react-custom-scrollbars-2';

type Props = {
    children: ReactNode;
    wrapperProps?: HTMLAttributes<HTMLDivElement>;
    innerProps?: HTMLAttributes<HTMLDivElement>;
};

const Scroller: FC<Props> = ({ children, innerProps, wrapperProps }) => {
    return (
        <div {...wrapperProps}>
            <Scrollbars
                data-lenis-prevent
                style={{ width: '100%', height: '100%' }}
                renderThumbVertical={({ style, ...props }) => (
                    <div
                        style={{
                            ...style,
                            margin: '0 auto',
                            marginTop: '8px',
                            marginBottom: '8px',
                            width: '3px',
                            borderRadius: '9999px',
                            zIndex: 1000,
                        }}
                        {...props}
                    />
                )}
                renderTrackHorizontal={({ style, ...props }) => <div style={{ ...style, width: '3px', borderRadius: '9999px', zIndex: 1000 }} {...props} />}
                renderView={({ style, ...props }) => <div style={style} {...innerProps} {...props} />}
            >
                {children}
            </Scrollbars>

            {wrapperProps?.children}
        </div>
    );
};

export default Scroller;
