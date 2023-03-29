import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { ActionContext, PlannerAction } from '../types';
import { PlannerContext } from '../PlannerContext';

const CircleButton = (props) => {
    return (
        <button
            onClick={props.onClick}
            className={`svg-circle-button ${props.className}`}
            style={{
                padding: 0,
                border: 0,
                background: 'none',
                ...props.style,
            }}
            title={props.label}
        >
            <div className="container">
                <i className={props.icon} />
            </div>
        </button>
    );
};

export enum ActionButtonTransition {
    BLOCK_SLIDE = 'block-slide',
    FADE = 'fade',
}

interface ActionButtonProps {
    pointType?: 'left' | 'right' | 'center';
    x: number;
    y: number;
    show: boolean;
    transition?: ActionButtonTransition;
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
    const enabledActions = props.actions.filter((action) =>
        action.enabled(planner, props.actionContext)
    );

    // Allow changing the transition style
    const { transition = ActionButtonTransition.FADE } = props;
    const slant = -0.5;
    const midIndex = Math.floor(enabledActions.length / 2);
    const midYOffset = 50;
    const spaceOut = 10;
    const buttonWidth = width / enabledActions.length;
    const getXCoord = (ix: number) => {
        return (ix - midIndex) * buttonWidth;
    };
    const getXOffset = (ix: number) => {
        if (enabledActions.length === 1 || ix === midIndex) {
            return 0;
        }
        const dist = Math.abs(ix - midIndex);
        return ix < midIndex ? -dist * spaceOut : dist * spaceOut;
    };
    const getYOffset = (ix: number) => {
        return Math.abs(getXCoord(ix) + getXOffset(ix)) * slant + midYOffset;
    };
    const { wrapperStyle, buttonStyle, transitionOffset } = {
        [ActionButtonTransition.BLOCK_SLIDE]: {
            wrapperStyle: {
                overflow: 'visible',
            },
            buttonStyle: (ix: number) => ({
                transition: `transform 0.2s linear ${ix * 0.1}s`,
                transform: `translateY(${
                    props.show ? getYOffset(ix) : 0
                }px) translateX(${props.show ? getXOffset(ix) : 0}px)`,
            }),
            transitionOffset: midYOffset,
        },
        [ActionButtonTransition.FADE]: {
            wrapperStyle: {
                transition: 'opacity 0.2s',
                opacity: props.show ? 1 : 0,
                overflow: 'visible',
            },
            transitionOffset: 0,
        },
    }[transition];

    return (
        <svg
            x={xCoord}
            y={props.y - height / 2 - transitionOffset}
            width={width || 150}
            height={height || 150}
        >
            <foreignObject
                x={0}
                y={0}
                height={height || 150}
                width={width || 150}
                style={wrapperStyle}
            >
                {/* inline element to get exact width and height */}
                <span
                    ref={ref}
                    style={{
                        display: 'inline-flex',
                        justifyContent: 'center',
                        gap: '2px',
                    }}
                >
                    {enabledActions.map((action: PlannerAction<any>, ix) => {
                        return (
                            <CircleButton
                                key={ix}
                                label={action.label}
                                icon={action.icon}
                                className={action.buttonStyle}
                                onClick={() =>
                                    action.onClick(planner, props.actionContext)
                                }
                                style={buttonStyle && buttonStyle(ix)}
                            />
                        );
                    })}
                </span>
            </foreignObject>
        </svg>
    );
};
