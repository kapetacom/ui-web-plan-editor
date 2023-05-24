import React from 'react';
import { toClass, createHexagonPath, Orientation } from '@kapeta/ui-web-utils';

import { ResourceRole } from '@kapeta/ui-web-types';
import { PlannerOutlet, plannerRenderer } from '../renderers/plannerRenderer';

import { PlannerNodeSize } from '../../types';
import './BlockResource.less';
import { ActionContext } from '../types';

interface PlannerResourceProps {
    size?: PlannerNodeSize;
    role?: ResourceRole;
    type: string;
    typeName?: string;
    name: string;
    height: number;
    width: number;
    readOnly?: boolean;
    actionContext: ActionContext;
}

export const BlockResource = (props: PlannerResourceProps) => {
    const nodeSize = props.size !== undefined ? props.size : PlannerNodeSize.MEDIUM;
    const isSmall = nodeSize === PlannerNodeSize.SMALL;
    const consumer = props.role === ResourceRole.CONSUMES;
    const textX = consumer ? 12 : 20;
    const hexagonPath = createHexagonPath(props.width, props.height, 2, Orientation.HORIZONTAL, 7);

    const resourceClass = toClass({
        'block-resource': true,
        [props.type]: true,
        'read-only': !!props.readOnly,
        small: isSmall,
    });

    const maxTextWidth = props.width - 50;

    const padding = 2;
    const heightWithoutPadding = props.height - padding * 2;

    return (
        <g className={resourceClass}>
            <path className="block-resource-body" d={hexagonPath} />
            <foreignObject width={maxTextWidth} className="block-resource-text resource-name" y={padding} x={textX}>
                <plannerRenderer.Outlet id={PlannerOutlet.ResourceTitle} context={props.actionContext}>
                    <span>{props.name}</span>
                </plannerRenderer.Outlet>
            </foreignObject>

            <foreignObject
                width={maxTextWidth}
                className="block-resource-text sub"
                y={heightWithoutPadding / 2}
                x={textX}
            >
                <plannerRenderer.Outlet id={PlannerOutlet.ResourceSubTitle} context={props.actionContext}>
                    <span>{props.typeName || props.type}</span>
                </plannerRenderer.Outlet>
            </foreignObject>
        </g>
    );
};
