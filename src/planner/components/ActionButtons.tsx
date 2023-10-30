/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActionContext, PlannerAction } from '../types';
import { PlannerContext, PlannerContextData } from '../PlannerContext';
import { staggeredFade } from '../utils/transitionUtils';
import './ActionButtons.less';
import { usePrevious } from 'react-use';
import { toClass } from '@kapeta/ui-web-utils';

const CircleButton = (props: any) => {
    // NOTE: A bit strange - but this has to be a div to not experience a UI glitch where the button
    // receives some sort of focus and is moved into view when closing the sidepanel it opens
    return (
        <div
            data-kap-id={props['data-kap-id']}
            onClick={props.onClick}
            className={`svg-circle-button ${props.className}`}
            style={{ padding: 0, border: 0, background: 'none', ...(props.style || {}) }}
            title={props.label}
        >
            {/* White opaque background to avoid opacity in colors looking weird on top of connections */}
            <div className="bg-container">
                <div className="container">
                    <i className={props.icon} />
                </div>
            </div>
        </div>
    );
};

interface ActionButtonListProps {
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
export const ActionButtons = (props: ActionButtonListProps) => {
    const planner = useContext(PlannerContext);

    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const recalculateSize = useCallback(() => {
        const divContainer = ref.current;
        if (divContainer) {
            const { width: w, height: h } = divContainer.getBoundingClientRect();
            setWidth(w / planner.zoom);
            setHeight(h / planner.zoom);
        }
    }, [ref]);

    useLayoutEffect(() => {
        recalculateSize();
    }, [recalculateSize]);

    // Recalculate the size when the buttons change
    const renderedActions = props.actions.filter((action) => action.enabled(planner, props.actionContext));
    const noOfActions = renderedActions.length;
    const prevNoOfActions = usePrevious(renderedActions.length);
    useEffect(() => {
        if (prevNoOfActions !== noOfActions) {
            recalculateSize();
        }
    }, [noOfActions, prevNoOfActions, recalculateSize]);

    const { onSizeChange } = props;
    useEffect(() => {
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
    const buttonWidth = width / renderedActions.length;
    const transitionFn = {
        fade(buttonIx: number) {
            return staggeredFade(buttonIx, renderedActions.length, props.show);
        },
        slide(buttonIx: number) {
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
                        return (
                            <ActionButton
                                key={action.kapId || ix}
                                kapId={action.kapId}
                                action={action}
                                show={props.show}
                                transitionFn={() => transitionFn(ix)}
                                planner={planner}
                                actionContext={props.actionContext}
                            />
                        );
                    })}
                </div>
            </foreignObject>
        </svg>
    );
};

interface ActionButtonProps {
    action: PlannerAction<any>;
    planner: PlannerContextData;
    actionContext: ActionContext;
    show: boolean;
    transitionFn: () => any;
    /**
     * Used to identify the button in tests and analytics
     */
    kapId?: string;
}

const ActionButton = (props: ActionButtonProps) => {
    const [processing, setProcessing] = useState(false);
    const label =
        typeof props.action.label === 'function'
            ? props.action.label(props.planner, props.actionContext)
            : props.action.label;

    let icon =
        typeof props.action.icon === 'function'
            ? props.action.icon(props.planner, props.actionContext)
            : props.action.icon;

    const buttonStyle =
        typeof props.action.buttonStyle === 'function'
            ? props.action.buttonStyle(props.planner, props.actionContext)
            : props.action.buttonStyle;

    if (processing) {
        icon = 'fa fa-cog fa-spin';
    }

    const containerClass = toClass({
        [buttonStyle]: true,
        processing,
    });

    return (
        <CircleButton
            data-kap-id={props.kapId}
            label={label}
            icon={icon}
            className={containerClass}
            style={{
                pointerEvents: props.show ? 'auto' : 'none',
                ...props.transitionFn(),
            }}
            onClick={async () => {
                if (processing) {
                    return;
                }
                const out = props.action.onClick(props.planner, props.actionContext);
                if (out instanceof Promise) {
                    setProcessing(true);
                    try {
                        await out;
                    } catch (e) {
                        console.warn('Error while processing action', e);
                    } finally {
                        setProcessing(false);
                    }
                }
            }}
        />
    );
};
