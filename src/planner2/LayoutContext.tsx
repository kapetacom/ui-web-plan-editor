/**
 * Helper context to
 */

import React, { useContext } from 'react';

export const LayoutContext = React.createContext({
    offset: {
        x: 0,
        y: 0,
    },
});

export const LayoutNode: React.FC<
    React.PropsWithChildren & { x?: number; y?: number }
> = (props) => {
    const layout = useContext(LayoutContext);

    return (
        <LayoutContext.Provider
            value={{
                offset: {
                    x: layout.offset.x + (props.x || 0),
                    y: layout.offset.y + (props.y || 0),
                },
            }}
        >
            {props.children}
        </LayoutContext.Provider>
    );
};

export const SVGLayoutNode: React.FC<
    React.SVGProps<SVGSVGElement> & { x?: number; y?: number }
> = (props) => {
    return (
        <LayoutNode x={props.x} y={props.y}>
            <svg {...props}>{props.children}</svg>
        </LayoutNode>
    );
};
