/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import {
    Box,
    CircularProgress,
    circularProgressClasses,
    CircularProgressProps,
    IconButton,
    keyframes,
    Menu,
    MenuItem,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import { Language, Link, LinkOff, MoreVert } from '@mui/icons-material';
import { Tooltip as KapTooltip } from '@kapeta/ui-web-components';

interface GatewayCardProps {
    title: string;
    fallbackText?: string;

    loading?: boolean;
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

const pulsateAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  15% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  20% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

interface SpinningDonutProps extends Pick<CircularProgressProps, 'size' | 'thickness'> {
    color: string;
    loading: boolean;
}

function SpinningDonut(props: SpinningDonutProps) {
    const { color, loading, ...rest } = props;
    return (
        <Box sx={{ position: 'relative' }}>
            <CircularProgress {...rest} variant="determinate" sx={{ color, opacity: 0.4 }} value={100} />
            <CircularProgress
                variant={loading ? 'indeterminate' : 'determinate'}
                value={loading ? undefined : 100}
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    [`& .${circularProgressClasses.circle}`]: {
                        strokeLinecap: 'round',
                        animationDuration: '4s',
                    },
                    color,
                }}
                {...rest}
            />
        </Box>
    );
}

interface GlobeIconProps {
    statusText?: string;
    statusColor?: string;
    pulsate?: boolean;
}
const GlobeIcon = ({ statusText, statusColor = 'black', pulsate = false }: GlobeIconProps) => (
    <KapTooltip title={statusText} disableInteractive>
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                flexShrink: 0,
                animation: pulsate ? `${pulsateAnimation} 3s ease-in-out infinite` : 'none',
            }}
        >
            <Language sx={{ color: statusColor }} />
            <Box sx={{ position: 'absolute', left: 0, top: 0 }}>
                <SpinningDonut size={32} thickness={1} color={statusColor} loading={pulsate} />
            </Box>
        </Box>
    </KapTooltip>
);

export const GatewayCard = (props: GatewayCardProps) => {
    const [menuRef, setMenuRef] = React.useState<HTMLElement | null>(null);
    const entry = props.primary || props.fallback;
    const fallbackText = props.fallbackText || 'Open on Kapeta.dev';

    // Status color
    const { palette } = useTheme();
    const statusColor = {
        ok: palette.success.main,
        loading: '#0000003b',
        error: palette.error.main,
    }[entry?.status || 'loading'];
    const statusText: string = entry?.message || (props.loading && 'Loading') || '';
    const shouldPulsate = props.loading || entry?.status === 'loading';

    const card = (
        <Stack
            direction="row"
            gap="10px"
            alignItems="center"
            justifyContent="space-between"
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
            sx={{
                p: 1,
                border: '1px solid #0000003b',
                borderRadius: 1.5,
                width: '100%',
                '&, *, *::before, *::after': {
                    boxSizing: 'border-box',
                },
            }}
        >
            <GlobeIcon statusText={statusText} statusColor={statusColor} pulsate={shouldPulsate} />

            <Stack sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <KapTooltip arrow title={props.title} placement="top" disableInteractive>
                    <Typography variant="body2" fontSize={12} fontWeight={600} noWrap>
                        {props.title}
                    </Typography>
                </KapTooltip>

                {entry?.url ? (
                    <Stack direction="row" alignItems="center" gap={0.5} height={18} fontSize={11}>
                        {entry.status === 'error' ? (
                            <KapTooltip arrow title={entry.message} disableInteractive>
                                <LinkOff fontSize="small" color="error" />
                            </KapTooltip>
                        ) : (
                            <Link fontSize="small" />
                        )}
                        <KapTooltip arrow title={`${entry?.url}`} disableInteractive>
                            <Typography variant="body2" fontSize={12} noWrap>
                                {entry?.url?.replace(/https?:\/\//, '')}
                            </Typography>
                        </KapTooltip>
                    </Stack>
                ) : null}
            </Stack>

            <IconButton
                size="small"
                onClick={(e) => {
                    e.preventDefault(); // Prevent the anchor from navigating
                    setMenuRef(e.currentTarget);
                }}
                data-kap-id="gateway-context-menu"
            >
                <MoreVert fontSize="small" />
            </IconButton>

            <Menu
                anchorEl={menuRef}
                open={!!menuRef}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
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
                    data-kap-id="configure-gateway"
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
                        data-kap-id="open-custom-url"
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
                    data-kap-id="open-kapeta-url"
                >
                    {fallbackText}
                </MenuItem>
            </Menu>
        </Stack>
    );

    return entry?.url ? (
        <a
            data-kap-id="open-gateway-url"
            href={entry?.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
        >
            {card}
        </a>
    ) : (
        card
    );
};
