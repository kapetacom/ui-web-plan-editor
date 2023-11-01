/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { Tooltip, TooltipProps } from '@kapeta/ui-web-components';
import { InfoOutlined } from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';

interface Props {
    content: string | React.ReactNode;
    readMoreLink?: string;
    fontSize?: SvgIconProps['fontSize'];
    color?: SvgIconProps['color'];
    placement?: TooltipProps['placement'];
}

export const TipIcon = (props: Props) => {
    return (
        <Tooltip
            placement={props.placement}
            title={
                <>
                    {props.content}
                    {props.readMoreLink && (
                        <>
                            <br />
                            <a href={props.readMoreLink} target="_blank">
                                Read more
                            </a>
                        </>
                    )}
                </>
            }
        >
            <InfoOutlined
                fontSize={props.fontSize ?? 'inherit'}
                sx={{
                    ml: 0.5,
                    color: props.color ?? 'action.active',
                    lineHeight: 'inherit',
                    cursor: 'help',
                    display: 'inline-block',
                }}
            />
        </Tooltip>
    );
};
