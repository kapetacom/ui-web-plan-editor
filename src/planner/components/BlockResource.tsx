import React from 'react';
import { toClass, createHexagonPath, Orientation } from '@kapeta/ui-web-utils';

import { ResourceRole } from '@kapeta/ui-web-types';
import { PlannerOutlet, plannerRenderer } from '../renderers/plannerRenderer';

import { PlannerNodeSize } from '../../types';
import './BlockResource.less';
import { ActionContext } from '../types';
import { BlockResourceIcon } from './BlockResourceIcon';

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
}

export const BlockResource = (props: PlannerResourceProps) => {
    const nodeSize = props.size !== undefined ? props.size : PlannerNodeSize.MEDIUM;
    const isSmall = nodeSize === PlannerNodeSize.SMALL;
    const consumer = props.role === ResourceRole.CONSUMES;

    const textX = consumer ? 40 : 20;
    const iconX = consumer ? 10 : 110;

    const height = 48;
    const width = 190;

    // TODO: Fix hexagon path, the path does not have the specified dimensions (width, height)
    const hexagonPath = createHexagonPath(width, height, 2, Orientation.HORIZONTAL, 7);

    const resourceClass = toClass({
        'block-resource': true,
        [props.type]: true,
        'read-only': !!props.readOnly,
        small: isSmall,
    });

    const maxTextWidth = width - 95;

    const padding = 8;

    return (
        <g className={resourceClass}>
            {props.type === 'operator' ? (
                <rect className="block-resource-body" width={width - 10} height={height} rx="3" ry="3" x="3" />
            ) : (
                <path className="block-resource-body" d={hexagonPath} strokeLinejoin="round" rx="3" ry="3" />
            )}
            <foreignObject width={maxTextWidth} className="block-resource-text resource-name" y={padding} x={textX}>
                <plannerRenderer.Outlet id={PlannerOutlet.ResourceTitle} context={props.actionContext}>
                    <span>{props.name}</span>
                </plannerRenderer.Outlet>
            </foreignObject>

            <foreignObject width={maxTextWidth} className="block-resource-text sub" y={padding + 15} x={textX}>
                <plannerRenderer.Outlet id={PlannerOutlet.ResourceSubTitle} context={props.actionContext}>
                    <span>{props.typeName || props.type}</span>
                </plannerRenderer.Outlet>
            </foreignObject>

            <BlockResourceIcon
                x={iconX}
                y={height / 2 - 10}
                // TODO: Icons for providers should be implemented (use asset icon component)
                typeIcon={props.type as 'internal' | 'operator'}
                actionIcon={props.typeStatusIcon || 'arrow'}
                color={props.typeStatusColor}
            />
        </g>
    );
};
