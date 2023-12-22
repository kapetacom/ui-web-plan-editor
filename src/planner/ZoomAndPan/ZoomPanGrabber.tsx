/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Box } from '@mui/material';
import React, { forwardRef } from 'react';

export interface ZoomPanGrabberProps {
    className?: string;
}

export const ZoomPanGrabber = forwardRef<HTMLDivElement, ZoomPanGrabberProps>((props, ref) => {
    return (
        <Box
            ref={ref}
            className={props.className}
            sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                cursor: 'grab',
            }}
        />
    );
});
