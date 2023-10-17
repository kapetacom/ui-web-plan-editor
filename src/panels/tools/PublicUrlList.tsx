import React, { useContext } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { PlannerContext } from '../../planner/PlannerContext';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { withErrorBoundary } from 'react-error-boundary';
import { Tooltip as KapTooltip, EmptyStateBox, KindIcon } from '@kapeta/ui-web-components';
import { BlockDefinition, IconType } from '@kapeta/schemas';
import MoreVert from '@mui/icons-material/MoreVert';
import { InstanceStatus } from '@kapeta/ui-web-context';
import { LinkOff } from '@mui/icons-material';

interface PublicUrlListProps {
    onConfigureGateway: (blockId: string) => void;
}

interface PublicUrlListItemProps {
    title: string;
    loading?: boolean;
    status?: InstanceStatus;

    primary?: {
        url: string | null;
        status?: 'ok' | 'loading' | 'error';
        message?: string | null;
    };
    fallback?: {
        url: string | null;
        status?: 'ok' | 'loading' | 'error';
        message?: string | null;
    };

    onConfigureGateway?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const TypeIconWrapper = (props: React.PropsWithChildren) => (
    <Box
        sx={{
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '17px',
            border: '1px solid black',
            flexShrink: 0,
        }}
    >
        {props.children}
    </Box>
);

export const PublicUrlListItem = (props: PublicUrlListItemProps) => {
    const entry = props.primary || props.fallback;
    const statusColor = {
        [InstanceStatus.STARTING]: 'success.main',
        [InstanceStatus.READY]: 'success.main',
        [InstanceStatus.STOPPED]: '#0000003b',
        [InstanceStatus.EXITED]: 'warning.main',
        [InstanceStatus.UNHEALTHY]: 'warning.main',
    }[props.status || InstanceStatus.STOPPED];
    //
    const shouldPulse =
        props.loading || props.status === InstanceStatus.STARTING || props.status === InstanceStatus.UNHEALTHY;

    return (
        <Stack
            sx={{ py: 2, border: '1px solid #0000003b', borderRadius: '6px', width: '100%' }}
            direction="row"
            gap={1}
            justifyContent="space-between"
        >
            <Stack direction="row" sx={{ pl: 2, overflow: 'hidden' }} flexGrow={1} gap={1}>
                <TypeIconWrapper>
                    <KindIcon kind="null" icon={{ value: 'fa fa-globe', type: IconType.Fontawesome5 }} size={24} />
                </TypeIconWrapper>
                <Stack sx={{ overflow: 'hidden' }} flexGrow={1}>
                    <KapTooltip arrow title={props.title} placement="top">
                        <Typography
                            variant="subtitle2"
                            sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                        >
                            {props.title}
                        </Typography>
                    </KapTooltip>

                    {entry?.url ? (
                        <KapTooltip arrow title={`${entry?.url}`}>
                            <a
                                href={entry?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                }}
                            >
                                {entry.status === 'error' ? (
                                    <LinkOff sx={{ mr: 1 }} fontSize="small" color="error" />
                                ) : null}
                                {entry?.url?.replace(/https?:\/\//, '')}
                            </a>
                        </KapTooltip>
                    ) : null}
                </Stack>
            </Stack>
            <Stack direction="row">
                <Box
                    component="svg"
                    width={24}
                    height={24}
                    color={statusColor}
                    sx={{
                        '& > circle': shouldPulse
                            ? {
                                  animation: 'pulse 1.5s infinite',
                                  '@keyframes pulse': {
                                      '0%': {
                                          opacity: 1,
                                      },
                                      '50%': {
                                          opacity: 0.5,
                                      },
                                      '100%': {
                                          opacity: 1,
                                      },
                                  },
                              }
                            : {},
                    }}
                >
                    <circle cx={18} cy={8} r={4} fill="currentColor" />
                </Box>
                <IconButton>
                    <MoreVert />
                </IconButton>
            </Stack>
        </Stack>
    );
};

export const PublicUrlList = withErrorBoundary(
    (props: PublicUrlListProps) => {
        const planner = useContext(PlannerContext);

        const blockDefinitions: Array<[string, BlockDefinition | undefined]> =
            planner.plan?.spec.blocks.map((block) => [block.id, planner.getBlockById(block.id)]) ?? [];

        const gateways = blockDefinitions
            .filter(
                ([blockId, block]) =>
                    !!block && parseKapetaUri(block.kind).fullName === 'kapeta/block-type-gateway-http'
            )
            .map(([blockId, block]) => {
                const instance = planner.plan!.spec.blocks.find((blockX) => blockX.id === blockId)!;
                return {
                    title: instance?.name || block!.metadata.title || block!.metadata.title || blockId,
                    id: blockId,
                    definition: block!,
                    instance,
                };
            });

        return (
            <Stack gap={2}>
                <Typography>Public URLs will be available on all gateways in the plan.</Typography>

                {gateways.length ? (
                    gateways.map((gateway) => {
                        return <PublicUrlListItem title={gateway.title} />;
                    })
                ) : (
                    <EmptyStateBox
                        title="No public URLs"
                        description="No gateways found. Add gateways to the plan to create public URLs for deployments."
                    />
                )}
            </Stack>
        );
    },
    {
        fallback: <Typography>:( Failed to render public URLs.</Typography>,
    }
);
