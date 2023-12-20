/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { GatewayCard } from '../src/components/GatewayCard';

export default {
    title: 'Gateway Cards',
    decorators: [
        (Story: any) => (
            // To defeat the 100% height/width of the storybook container
            <div>
                <Story />
            </div>
        ),
    ],
};

const groups: { label?: string; props: Partial<React.ComponentProps<typeof GatewayCard>> }[][] = [
    [
        {
            label: 'Loading',
            props: { loading: true },
        },
        {
            label: 'No URLs available',
            props: {},
        },
        {
            label: 'Editor mode',
            props: {
                fallbackText: 'Open in browser',
                primary: undefined,
                fallback: {
                    url: 'http://localhost:3000',
                    status: 'ok',
                },
            },
        },
        {
            props: {
                title: 'No urls',
                fallbackText: 'Open in browser',
                primary: undefined,
                fallback: {
                    url: null,
                    status: 'ok',
                },
            },
        },
        {
            props: {
                title: 'View only',
                fallbackText: 'Open in browser',
                onConfigureGateway: undefined,
                primary: undefined,
                fallback: {
                    url: null,
                    status: 'ok',
                },
            },
        },
    ],
    [
        {
            label: 'URL statuses',
            props: { title: 'Loading', primary: { status: 'loading', url: 'https://example.com' } },
        },
        {
            props: {
                title: 'Error',
                primary: { status: 'error', url: 'https://example.com', message: 'An error occurred' },
            },
        },
        {
            props: { title: 'Ok', primary: { status: 'ok', url: 'https://example.com', message: 'URL is ready' } },
        },
        {
            label: 'Custom color',
            props: {
                title: 'Ok',
                color: 'warning.main',
                loading: true,
                primary: { status: 'ok', url: 'https://example.com', message: 'URL is ready' },
            },
        },
    ],

    [
        {
            label: 'Custom URL',
            props: {
                primary: {
                    url: 'https://example.com',
                    status: 'loading',
                },
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'ok',
                },
            },
        },
        {
            props: {
                primary: {
                    url: 'https://example.com',
                    status: 'ok',
                },
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'ok',
                },
            },
        },
        {
            props: {
                primary: {
                    url: 'https://example.com',
                    status: 'error',
                    message: 'Unable to connect to gateway',
                },
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'ok',
                },
            },
        },
        {
            label: 'Custom URL (long)',
            props: {
                primary: { url: 'https://example.com/this/is/a/long/url/that/should/be/truncated' },
                fallback: { url: 'https://kap-abc.kapeta.dev' },
            },
        },
    ],
    [
        {
            label: 'Fallback only',
            props: {
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'loading',
                },
            },
        },
        {
            props: {
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'ok',
                },
            },
        },
        {
            props: {
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'error',
                    message: 'Unable to connect to gateway',
                },
            },
        },
    ],
];

export const GatewayCards = () => {
    const [isVerified, setIsVerified] = React.useState(false);
    React.useEffect(() => {
        const timeout = setTimeout(() => setIsVerified(true), 30000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <Stack direction="row" gap={2}>
            {groups.map((group) => (
                <Stack gap={1}>
                    {group.map((variant) => (
                        <Box sx={{ width: '250px' }} key={variant.label}>
                            {variant.label ? <Typography variant="caption">{variant.label}</Typography> : null}
                            <GatewayCard
                                title="HTTP Gateway"
                                onConfigureGateway={() => {}}
                                onMouseEnter={() => {}}
                                onMouseLeave={() => {}}
                                {...variant.props}
                            />
                        </Box>
                    ))}
                </Stack>
            ))}
        </Stack>
    );
};
