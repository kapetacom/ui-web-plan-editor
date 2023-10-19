import React from 'react';
import { Box, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { InstanceStatus } from '@kapeta/ui-web-context';
import { Language, Link, LinkOff, MoreVert } from '@mui/icons-material';
import { Tooltip as KapTooltip } from '@kapeta/ui-web-components';

interface GatewayCardProps {
    title: string;
    fallbackText?: string;

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

export const GatewayCard = (props: GatewayCardProps) => {
    const [menuRef, setMenuRef] = React.useState<HTMLElement | null>(null);
    const entry = props.primary || props.fallback;
    const fallbackText = props.fallbackText || 'Open on Kapeta.dev';
    const statusColor = {
        [InstanceStatus.STARTING]: 'success.main',
        [InstanceStatus.READY]: 'success.main',
        [InstanceStatus.STOPPING]: 'success.main',
        [InstanceStatus.STOPPED]: '#0000003b',
        [InstanceStatus.FAILED]: 'error.main',
        [InstanceStatus.UNHEALTHY]: 'warning.main',
        [InstanceStatus.BUSY]: 'warning.main',
    }[props.status || InstanceStatus.STOPPED];

    const titleMapping = {
        [InstanceStatus.STARTING]: 'Block is starting',
        [InstanceStatus.READY]: 'Block is ready',
        [InstanceStatus.UNHEALTHY]: 'Block is unhealthy',
        [InstanceStatus.FAILED]: 'Block failed to start, or has crashed. Check logs for more information.',
        [InstanceStatus.STOPPED]: 'Block has stopped',
        [InstanceStatus.STOPPING]: 'Block is stopping',
        [InstanceStatus.BUSY]: 'Block is unresponsive',
    };
    //
    const shouldPulse =
        props.loading ||
        props.status === InstanceStatus.STARTING ||
        props.status === InstanceStatus.STOPPING ||
        props.status === InstanceStatus.UNHEALTHY;
    const statusText = titleMapping[props.status || InstanceStatus.STOPPED];

    return (
        <Stack
            sx={{ py: 1, border: '1px solid #0000003b', borderRadius: '6px', width: '100%' }}
            direction="row"
            gap={1}
            justifyContent="space-between"
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
        >
            <Stack direction="row" sx={{ pl: 1.5, overflow: 'hidden' }} flexGrow={1} gap={1} alignItems="center">
                <TypeIconWrapper>
                    <Language />
                </TypeIconWrapper>
                <Stack sx={{ overflow: 'hidden' }} flexGrow={1} justifyContent="center">
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
                <KapTooltip arrow title={statusText} placement="top">
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
                </KapTooltip>
                <IconButton onClick={(e) => setMenuRef(e.currentTarget)}>
                    <MoreVert />
                </IconButton>
            </Stack>

            <Menu
                anchorEl={menuRef}
                open={!!menuRef}
                onClose={() => setMenuRef(null)}
                sx={{
                    '& .MuiMenuItem-root': {
                        fontSize: '12px',
                    },
                }}
            >
                <MenuItem
                    disabled={!props.onConfigureGateway}
                    onClick={() => {
                        props.onConfigureGateway?.();
                        setMenuRef(null);
                    }}
                >
                    Configure
                </MenuItem>
                {props.primary ? (
                    <MenuItem
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={props.primary?.url || ''}
                        disabled={!props.primary?.url}
                        onClick={() => setMenuRef(null)}
                    >
                        Open custom URL
                    </MenuItem>
                ) : null}
                <MenuItem
                    component="a"
                    target="_blank"
                    rel="noopener noreferrer"
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
