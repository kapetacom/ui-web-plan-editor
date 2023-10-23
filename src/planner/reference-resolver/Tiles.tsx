import { KapetaURI } from '@kapeta/nodejs-utils';
import React, { PropsWithChildren, ReactNode } from 'react';
import { Box, Stack, SxProps, Typography } from '@mui/material';
import { IconValue } from '@kapeta/schemas';
import { KindIcon } from '@kapeta/ui-web-components';

export function createSubTitle(hasVersionAlternatives: boolean, refUri: KapetaURI) {
    return hasVersionAlternatives ? (
        <span>
            {refUri.fullName}:<span className={'error'}>{refUri.version}</span>
        </span>
    ) : (
        <span className={'error'}>{refUri.id}</span>
    );
}

export const Tile = (props: PropsWithChildren & { sx?: SxProps }) => {
    return (
        <Stack
            direction={'row'}
            gap={1}
            alignItems={'center'}
            sx={{
                borderRadius: '4px',
                bgcolor: 'grey.100',
                minHeight: '60px',
                p: 1,
                px: 2,
                '& .error': {
                    color: 'error.main',
                    fontWeight: 400,
                },
                ...props.sx,
            }}
        >
            {props.children}
        </Stack>
    );
};

export const ReferenceTile = (props: {
    title: string;
    subtitle: string | ReactNode;
    kind: string;
    icon?: IconValue;
}) => {
    const blockTitle = props.title;
    const blockSubTitle = props.subtitle;
    return (
        <Tile
            sx={{
                '& .error': {
                    color: 'error.main',
                    fontWeight: 400,
                },
            }}
        >
            <KindIcon size={24} kind={props.kind} icon={props.icon} title={props.title} />
            <Box
                sx={{
                    fontSize: '12px',
                }}
            >
                <Typography fontSize={'inherit'} fontWeight={500}>
                    {blockTitle}
                </Typography>
                <Typography fontSize={'inherit'}>{blockSubTitle}</Typography>
            </Box>
        </Tile>
    );
};
