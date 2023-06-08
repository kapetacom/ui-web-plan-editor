import React from 'react';
import { createHexagonPath, Orientation, toClass } from '@kapeta/ui-web-utils';

import './BlockNode.less';
import { PlannerBlockWarningTag } from './PlannerBlockWarningTag';
import { BlockStatus, useBlock } from '@kapeta/ui-web-components';
import { BlockInstanceName } from '@kapeta/ui-web-components';
import { BlockName } from '@kapeta/ui-web-components';
import { BlockHandle } from '@kapeta/ui-web-components';
import { BlockVersion } from '@kapeta/ui-web-components';

interface BlockNodeProps {
    height: number;
    width: number;
    pointSize?: number;
    valid?: boolean;
    variant?: string;
    readOnly?: boolean;
}

export const BlockNode = (props: BlockNodeProps) => {
    const variant = props.variant ? props.variant : 'service';
    const block = useBlock();

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

                <PlannerBlockWarningTag
                    show={props.valid === false}
                    blockName={block.definition?.metadata.name || 'block'}
                />

                <g transform={`translate(${props.width - 20}, 0)`}>
                    <BlockStatus />
                </g>

                <g transform={`translate(${centeredX}, 50)`}>
                    <BlockInstanceName />
                </g>

                <svg y={85} x={centeredX}>
                    <BlockName />
                </svg>

                <svg y={100} x={centeredX}>
                    <BlockHandle />
                </svg>

                <svg y={120} x={centeredX}>
                    <BlockVersion />
                </svg>
            </g>
        </>
    );
};
