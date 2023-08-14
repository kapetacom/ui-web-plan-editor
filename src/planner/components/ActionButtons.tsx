import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { ActionContext, PlannerAction } from '../types';
import { PlannerContext } from '../PlannerContext';
import { staggeredFade } from '../utils/transitionUtils';
import './ActionButtons.less';

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

    const ref = useRef<HTMLDivElement>(null);
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
                transition: `transform 0.3s`,
                transform: props.show
                    ? 'translateX(0px)'
                    : `translateX(${
                          props.pointType === 'left' ? -buttonWidth * (buttonIx + 1) : width - buttonWidth * buttonIx
                      }px)`,
            };
        },
    }[props.transition || 'fade'];

    const aHeight = height || 150;
    const aWidth = width || 150;

    if (renderedActions.length === 0) {
        return null;
    }
    return (
        <svg x={xCoord} y={props.y - height / 2} height={aHeight} width={aWidth} viewBox={`0 0 ${aWidth} ${aHeight}`}>
            <foreignObject
                x={0}
                y={0}
                height={aHeight}
                width={aWidth}
                style={{ position: 'relative', top: 0, left: 0 }}
            >
                {/* inline element to get exact width and height */}
                <div ref={ref} className="action-buttons-container">
                    {renderedActions.map((action: PlannerAction<any>, ix) => {
                        const label =
                            typeof action.label === 'function'
                                ? action.label(planner, props.actionContext)
                                : action.label;

                        const icon =
                            typeof action.icon === 'function' ? action.icon(planner, props.actionContext) : action.icon;

                        const buttonStyle =
                            typeof action.buttonStyle === 'function'
                                ? action.buttonStyle(planner, props.actionContext)
                                : action.buttonStyle;

                        return (
                            <CircleButton
                                key={ix}
                                label={label}
                                icon={icon}
                                className={buttonStyle}
                                style={{
                                    pointerEvents: props.show ? 'auto' : 'none',
                                    ...transitionFn(ix),
                                }}
                                onClick={() => action.onClick(planner, props.actionContext)}
                            />
                        );
                    })}
                </div>
            </foreignObject>
        </svg>
    );
};
