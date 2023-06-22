import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { ActionContext, PlannerAction } from '../types';
import { PlannerContext } from '../PlannerContext';
import { staggeredFade } from '../utils/transitionUtils';

const CircleButton = (props) => {
    return (
        <button
            onClick={props.onClick}
            className={`svg-circle-button ${props.className}`}
            style={{ padding: 0, border: 0, background: 'none', ...(props.style || {}) }}
            title={props.label}
        >
            <div className="container">
                <i className={props.icon} />
            </div>
        </button>
    );
};

interface ActionButtonProps {
    pointType?: 'left' | 'right' | 'center';
    transition?: 'fade' | 'slide';
    x: number;
    y: number;
    show: boolean;
    actions: PlannerAction<any>[];
    actionContext: ActionContext;
    onSizeChange?: (width: number, height: number) => void;
}

// Automatically compensate for the width of the connection buttons
export const ActionButtons = (props: ActionButtonProps) => {
    const planner = useContext(PlannerContext);

    const ref = useRef<HTMLSpanElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        const span = ref.current;
        if (span) {
            const { width: w, height: h } = span.getBoundingClientRect();
            setWidth(w);
            setHeight(h);
        }
    }, [ref]);

    const { onSizeChange } = props;
    useLayoutEffect(() => {
        if (onSizeChange) {
            onSizeChange(width, height);
        }
    }, [width, height, onSizeChange]);

    // Allow changing the reference point of the buttons
    // Automatically offset the buttons based on the width
    const xCoord = {
        center: props.x - width / 2,
        left: props.x,
        right: props.x - width,
    }[props.pointType || 'center'];
    const renderedActions = props.actions.filter((action) => action.enabled(planner, props.actionContext));
    const buttonWidth = width / renderedActions.length;
    const transitionFn = {
        fade(buttonIx) {
            return staggeredFade(buttonIx, renderedActions.length, props.show);
        },
        slide(buttonIx) {
            // start at the edge of the button and slide in from a common point
            return {
                transition: `all 0.3s`,
                transform: props.show
                    ? 'translateX(0px)'
                    : `translateX(${
                          props.pointType === 'left' ? -buttonWidth * (buttonIx + 1) : width - buttonWidth * buttonIx
                      }px)`,
            };
        },
    }[props.transition || 'fade'];

    return (
        <svg x={xCoord} y={props.y - height / 2} width={width || 150} height={height || 150}>
            <foreignObject x={0} y={0} height={height || 150} width={width || 150}>
                {/* inline element to get exact width and height */}
                <span
                    ref={ref}
                    style={{
                        display: 'inline-flex',
                        justifyContent: 'center',
                        gap: '2px',
                    }}
                >
                    {renderedActions.map((action: PlannerAction<any>, ix) => {
                        return (
                            <CircleButton
                                key={ix}
                                label={action.label}
                                icon={action.icon}
                                className={action.buttonStyle}
                                style={{
                                    pointerEvents: props.show ? 'auto' : 'none',
                                    ...transitionFn(ix),
                                }}
                                onClick={() => action.onClick(planner, props.actionContext)}
                            />
                        );
                    })}
                </span>
            </foreignObject>
        </svg>
    );
};
