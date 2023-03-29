import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { ActionContext, PlannerAction } from '../types';
import { PlannerContext } from '../PlannerContext';

const CircleButton = (props) => {
    return (
        <button
            onClick={props.onClick}
            className={`svg-circle-button ${props.style}`}
            style={{ padding: 0, border: 0, background: 'none' }}
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

    return (
        <svg
            x={xCoord}
            y={props.y - height / 2}
            width={width || 150}
            height={height || 150}
        >
            <foreignObject
                x={0}
                y={0}
                height={height || 150}
                width={width || 150}
                style={{
                    transition: 'all 0.2s',
                    opacity: props.show ? 1 : 0,
                }}
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
                    {props.actions.map((action: PlannerAction<any>, ix) => {
                        if (action.enabled(planner, props.actionContext)) {
                            return (
                                <CircleButton
                                    key={ix}
                                    label={action.label}
                                    icon={action.icon}
                                    style={action.buttonStyle}
                                    onClick={() =>
                                        action.onClick(
                                            planner,
                                            props.actionContext
                                        )
                                    }
                                />
                            );
                        }
                        return null;
                    })}
                </span>
            </foreignObject>
        </svg>
    );
};
