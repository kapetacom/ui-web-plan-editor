/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import { CircularProgress, Stack, SxProps, Typography } from '@mui/material';
import React from 'react';

interface Props {
    sx?: SxProps;
}

export const Waiter = (props: Props) => {
    return (
        <Stack sx={props.sx} width={'100%'} height={'100%'} alignItems={'center'} justifyContent={'center'}>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
                <CircularProgress color={'info'} size={18} />
                <Typography fontSize={12}>Please wait while checking references...</Typography>
            </Stack>
        </Stack>
    );
};
