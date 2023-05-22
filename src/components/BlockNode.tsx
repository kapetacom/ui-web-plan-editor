import React from 'react';
import { createHexagonPath, Orientation, toClass } from '@kapeta/ui-web-utils';
import { SVGText, SVGAutoSizeText } from '@kapeta/ui-web-components';

import './BlockNode.less';
import { PlannerBlockWarningTag } from './PlannerBlockWarningTag';
import { blockRenderer, BlockOutlet } from '../planner2/renderers/blockRenderer';

interface BlockNodeProps {
    name: string;
    typeName?: string;
    height: number;
    width: number;
    pointSize?: number;
    valid?: boolean;
    variant?: string;
    readOnly?: boolean;
}

export const BlockNode = (props: BlockNodeProps) => {
    const variant = props.variant ? props.variant : 'service';

    const className = toClass({
        'block-node': true,
        [variant]: true,
        'read-only': !!props.readOnly,
    });
    const pointSize = props.pointSize ? props.pointSize : 30;
    const path = createHexagonPath(props.width, props.height, 5, Orientation.VERTICAL, pointSize);
    const centeredX = props.width / 2;

    return (
        <>
            <g className={className} x={50}>
                <path className="block-body" d={path} />

                <PlannerBlockWarningTag show={!props.valid} blockName={props.name} />

                <svg y={0} x={props.width - 20}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockStatus} context={props} />
                </svg>

                <svg y={50} x={centeredX}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockInstanceName} context={props} />
                </svg>
                <svg y={85} x={centeredX}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockName} context={props} />
                </svg>
                <svg y={100} x={centeredX}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockHandle} context={props} />
                </svg>

                <svg y={120} x={centeredX}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockVersion} context={props} />
                </svg>
            </g>
        </>
    );
};
