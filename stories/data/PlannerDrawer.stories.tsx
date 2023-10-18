import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { PublicUrlListItem } from '../../src/panels/tools/PublicUrlList';
import { InstanceStatus } from '@kapeta/ui-web-context';

export default {
    title: 'Planner Drawer',
    decorators: [
        (Story) => (
            // To defeat the 100% height/width of the storybook container
            <div>
                <Story />
            </div>
        ),
    ],
};

const groups: { label?: string; props: Partial<React.ComponentProps<typeof PublicUrlListItem>> }[][] = [
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
                status: InstanceStatus.READY,
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
            label: 'Block statuses',
            props: { title: 'Starting', status: InstanceStatus.STARTING },
        },
        {
            props: { title: 'Ready', status: InstanceStatus.READY },
        },
        {
            props: { title: 'Unhealthy', status: InstanceStatus.UNHEALTHY },
        },
        {
            props: { title: 'Stopped', status: InstanceStatus.STOPPED },
        },
        {
            props: { title: 'Exited', status: InstanceStatus.EXITED },
        },
    ],

    [
        {
            label: 'Custom URL',
            props: {
                status: InstanceStatus.READY,
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
                status: InstanceStatus.READY,
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
                status: InstanceStatus.READY,
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
                status: InstanceStatus.READY,
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'loading',
                },
            },
        },
        {
            props: {
                status: InstanceStatus.READY,
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'ok',
                },
            },
        },
        {
            props: {
                status: InstanceStatus.READY,
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'error',
                    message: 'Unable to connect to gateway',
                },
            },
        },
    ],
];

export const LinksList = () => {
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
                            <PublicUrlListItem
                                title="HTTP Gateway"
                                onConfigureGateway={() => {}}
                                onMouseEnter={() => {}}
                                onMouseLeave={() => {}}
                                startTime={+new Date()}
                                {...variant.props}
                            />
                        </Box>
                    ))}
                </Stack>
            ))}
        </Stack>
    );
};
