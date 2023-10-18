import React, { useContext } from 'react';
import { Box, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { PlannerContext } from '../../planner/PlannerContext';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { withErrorBoundary } from 'react-error-boundary';
import { Tooltip as KapTooltip, EmptyStateBox, KindIcon } from '@kapeta/ui-web-components';
import { BlockDefinition, IconType } from '@kapeta/schemas';
import MoreVert from '@mui/icons-material/MoreVert';
import { InstanceStatus } from '@kapeta/ui-web-context';
import { Language, Link, LinkOff } from '@mui/icons-material';

interface PublicUrlListProps {
    onConfigureGateway: (blockId: string) => void;
}

interface PublicUrlListItemProps {
    title: string;
    fallbackText?: string;
    hidePrimary?: boolean;

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
    const [menuRef, setMenuRef] = React.useState<HTMLElement | null>(null);
    const entry = props.primary || props.fallback;
    const fallbackText = props.fallbackText || 'Open on Kapeta.dev';
    const statusColor = {
        [InstanceStatus.STARTING]: 'success.main',
        [InstanceStatus.READY]: 'success.main',
        [InstanceStatus.STOPPED]: '#0000003b',
        [InstanceStatus.EXITED]: 'error.main',
        [InstanceStatus.UNHEALTHY]: 'warning.main',
    }[props.status || InstanceStatus.STOPPED];
    //
    const shouldPulse =
        props.loading || props.status === InstanceStatus.STARTING || props.status === InstanceStatus.UNHEALTHY;

    return (
        <Stack
            sx={{ py: 1, border: '1px solid #0000003b', borderRadius: '6px', width: '100%' }}
            direction="row"
            gap={1}
            justifyContent="space-between"
        >
            <Stack direction="row" sx={{ pl: 1.5, overflow: 'hidden' }} flexGrow={1} gap={1}>
                <TypeIconWrapper>
                    <Language />
                </TypeIconWrapper>
                <Stack sx={{ overflow: 'hidden' }} flexGrow={1}>
                    <KapTooltip arrow title={props.title} placement="top">
                        <Typography
                            variant="body2"
                            fontSize={12}
                            fontWeight={600}
                            sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                        >
                            {props.title}
                        </Typography>
                    </KapTooltip>

                    {entry?.url ? (
                        <Stack direction="row" alignItems="center" gap={0.5} height={18} fontSize={11}>
                            {entry.status === 'error' ? (
                                <KapTooltip arrow title={entry.message}>
                                    <LinkOff fontSize="small" color="error" />
                                </KapTooltip>
                            ) : (
                                <Link fontSize="small" />
                            )}
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
                                    {entry?.url?.replace(/https?:\/\//, '')}
                                </a>
                            </KapTooltip>
                        </Stack>
                    ) : null}
                </Stack>
            </Stack>
            <Stack direction="row">
                <Box
                    component="svg"
                    width={8}
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
                    <circle cx={4} cy={8} r={4} fill="currentColor" />
                </Box>
                <IconButton onClick={(e) => setMenuRef(e.currentTarget)}>
                    <MoreVert />
                </IconButton>
            </Stack>

            <Menu anchorEl={menuRef} open={!!menuRef} onClose={() => setMenuRef(null)}>
                {props.onConfigureGateway ? (
                    <MenuItem
                        onClick={() => {
                            props.onConfigureGateway?.();
                            setMenuRef(null);
                        }}
                    >
                        Configure
                    </MenuItem>
                ) : null}
                {props.primary ? (
                    <MenuItem
                        component="a"
                        href={props.primary?.url || ''}
                        disabled={!props.primary?.url}
                        onClick={() => setMenuRef(null)}
                    >
                        Open custom URL
                    </MenuItem>
                ) : null}
                <MenuItem
                    component="a"
                    href={props.fallback?.url || ''}
                    disabled={!props.fallback?.url}
                    onClick={() => setMenuRef(null)}
                >
                    {fallbackText}
                </MenuItem>
            </Menu>
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
