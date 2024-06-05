/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext } from 'react';
import { createHexagonPath, Orientation, toClass } from '@kapeta/ui-web-utils';

import './BlockNode.less';
import { PlannerBlockWarningTag } from './PlannerBlockWarningTag';
import { BlockStatus, useBlock } from '@kapeta/ui-web-components';
import { BlockInstanceName } from '@kapeta/ui-web-components';
import { BlockName } from '@kapeta/ui-web-components';
import { BlockHandle } from '@kapeta/ui-web-components';
import { BlockVersion } from '@kapeta/ui-web-components';
import { Box } from '@mui/material';
import { PlannerContext } from '../planner/PlannerContext';
import { useAtomValue } from 'jotai';

interface BlockNodeProps {
    height: number;
    width: number;
    pointSize?: number;
    valid?: boolean;
    errors?: string[];
    variant?: string;
    readOnly?: boolean;
    onWarningClick?: () => void;
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

    // Highlight the block if it is hovered in the chat UI
    const { hoveredChatUIAtom } = useContext(PlannerContext);
    const hovered = useAtomValue(hoveredChatUIAtom);
    let highlight = false;
    if (
        (hovered?.type === 'block' || hovered?.type === 'type') &&
        hovered?.blockRef === block.instance?.block.ref &&
        hovered?.instanceId === block.instance?.id
    ) {
        highlight = true;
    }

    return (
        <>
            <g className={className} x={50}>
                <Box
                    component="path"
                    className="block-body block-border"
                    d={path}
                    sx={highlight ? { '&&': { stroke: '#651FFF', strokeWidth: 3, strokeOpacity: 1 } } : {}}
                />

                <PlannerBlockWarningTag
                    show={props.valid === false}
                    errors={props.errors}
                    blockName={block.definition?.metadata.name || 'block'}
                    onClick={props.onWarningClick}
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
