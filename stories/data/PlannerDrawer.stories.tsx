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
            label: 'No URLs (e.g. edit mode)',
            props: {},
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
                    message: 'Unable to connect to the gateway',
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
                    status: 'active',
                },
            },
        },
        {
            props: {
                fallback: {
                    url: 'https://kap-abc.kapeta.dev',
                    status: 'error',
                    message: 'Unable to connect to the gateway',
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
                                onConfigure={() => {}}
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
