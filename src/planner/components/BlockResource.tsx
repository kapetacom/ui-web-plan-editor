/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext } from 'react';
import { toClass, createHexagonPath, Orientation } from '@kapeta/ui-web-utils';

import { ResourceRole } from '@kapeta/ui-web-types';
import { PlannerOutlet, plannerRenderer } from '../renderers/plannerRenderer';

import { PlannerNodeSize } from '../../types';
import './BlockResource.less';
import { ActionContext } from '../types';
import { BlockResourceIcon } from './BlockResourceIcon';
import { Tooltip } from '@kapeta/ui-web-components';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import { PlannerContext } from '../PlannerContext';

interface PlannerResourceProps {
    size?: PlannerNodeSize;
    role?: ResourceRole;
    type: string;
    typeName?: string;
    typeStatusIcon: Parameters<typeof BlockResourceIcon>[0]['actionIcon'];
    typeStatusColor?: Parameters<typeof BlockResourceIcon>[0]['color'];
    name: string;
    readOnly?: boolean;
    actionContext: ActionContext;
    icon?: React.ReactNode;
}

export const BlockResource = (props: PlannerResourceProps) => {
    const nodeSize = props.size !== undefined ? props.size : PlannerNodeSize.MEDIUM;
    const isSmall = nodeSize === PlannerNodeSize.SMALL;
    const consumer = props.role === ResourceRole.CONSUMES;

    const textX = consumer ? 40 : 35;
    const iconX = consumer ? 12 : 120;

    const height = 48;
    const width = 150;

    const hexagonPath = createHexagonPath(width, height, 2, Orientation.HORIZONTAL, 7);

    const resourceClass = toClass({
        'block-resource': true,
        [props.type]: true,
        'read-only': !!props.readOnly,
        small: isSmall,
    });

    const maxTextWidth = width - 70;
    const [hasOverflow, setHasOverflow] = React.useState(false);
    const onRef = (el: HTMLSpanElement | null) => {
        if (el) {
            setHasOverflow(el.scrollWidth > el.offsetWidth);
        }
    };

    const padding = 8;

    // Highlight the resource if it is hovered in the chat UI
    const { hoveredChatUIAtom } = useContext(PlannerContext);
    const hovered = useAtomValue(hoveredChatUIAtom);
    let highlight = false;
    if (
        hovered?.blockRef === props.actionContext.blockInstance?.block.ref &&
        hovered?.instanceId === props.actionContext.blockInstance?.id
    ) {
        if (hovered?.resourceName === props.name) {
            if (hovered.type === 'api' && (props.typeName === 'rest api' || props.typeName === 'rest client')) {
                highlight = true;
            }
            if (hovered.type === 'model' && (props.typeName === 'postgres' || props.typeName === 'mongodb')) {
                highlight = true;
            }
        }
    }

    return (
        <Box
            component="g"
            className={resourceClass}
            sx={(theme) => {
                const isDarkMode = theme.palette.mode === 'dark';
                return {
                    ...(isDarkMode ? { '&&& .block-resource-text': { color: 'white' } } : {}),
                };
            }}
        >
            {props.type === 'operator' ? (
                <Box
                    component="rect"
                    className="block-resource-body"
                    width={width}
                    height={height}
                    rx="3"
                    ry="3"
                    x="3"
                    sx={(theme) => ({
                        ...(highlight
                            ? {
                                  '&&': {
                                      stroke: '#651FFF',
                                      strokeWidth: 3,
                                      strokeOpacity: 1,
                                  },
                              }
                            : {}),
                        ...(theme.palette.mode === 'dark'
                            ? {
                                  '&&&': {
                                      fill: '#212425',
                                      stroke: '#727272',
                                      strokeOpacity: 1,
                                      strokeWidth: 1,
                                  },
                              }
                            : {}),
                    })}
                />
            ) : (
                <Box
                    component="path"
                    className="block-resource-body"
                    d={hexagonPath}
                    strokeLinejoin="round"
                    rx="3"
                    ry="3"
                    sx={(theme) => ({
                        ...(highlight
                            ? {
                                  '&&': {
                                      stroke: '#651FFF',
                                      strokeWidth: 3,
                                      strokeOpacity: 1,
                                  },
                              }
                            : {}),
                        ...(theme.palette.mode === 'dark'
                            ? {
                                  '&&&': {
                                      fill: '#212425',
                                      stroke: '#727272',
                                      strokeOpacity: 1,
                                      strokeWidth: 1,
                                  },
                              }
                            : {}),
                    })}
                />
            )}
            <foreignObject width={maxTextWidth} className="block-resource-text resource-name" y={padding} x={textX}>
                <plannerRenderer.Outlet id={PlannerOutlet.ResourceTitle} context={props.actionContext}>
                    {hasOverflow ? (
                        <Tooltip
                            title={props.name}
                            // Estimate for overflow by string length
                            placement={consumer ? 'bottom-end' : 'bottom-start'}
                        >
                            <span ref={onRef}>{props.name}</span>
                        </Tooltip>
                    ) : (
                        <span ref={onRef}>{props.name}</span>
                    )}
                </plannerRenderer.Outlet>
            </foreignObject>

            <foreignObject width={maxTextWidth} className="block-resource-text sub" y={padding + 15} x={textX}>
                <plannerRenderer.Outlet id={PlannerOutlet.ResourceSubTitle} context={props.actionContext}>
                    <span>{props.typeName || props.type}</span>
                </plannerRenderer.Outlet>
            </foreignObject>

            {props.icon ? (
                <Box component="foreignObject" x={iconX} y={height / 2 - 10} width={20} height={20}>
                    {props.icon}
                </Box>
            ) : (
                <BlockResourceIcon
                    x={iconX}
                    y={height / 2 - 10}
                    typeIcon={props.type as 'internal' | 'operator'}
                    actionIcon={props.typeStatusIcon || 'arrow'}
                    color={props.typeStatusColor}
                />
            )}
        </Box>
    );
};
