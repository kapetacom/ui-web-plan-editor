import React, { forwardRef, PropsWithChildren, useState } from 'react';
import { Badge, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { SchemaKind } from '@kapeta/ui-web-types';
import { DateDisplay, InstallerService } from '@kapeta/ui-web-components';
import { AssetKindIcon, CoreTypes, SimpleLoader, useConfirm } from '@kapeta/ui-web-components';

import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';

import { BlockDefinition, Plan } from '@kapeta/schemas';

import { Delete } from '@mui/icons-material';
import { PlanPreview } from './PlanPreview';
import { BlockPreview, BlockTypePreview } from './BlockTypePreview';
import { ResourceTypePreview } from './ResourceTypePreview';
import { AssetInfo } from '../types';
import { BadgeTypeMap } from '@mui/material/Badge/Badge';

const CONTAINER_CLASS = 'asset-thumbnail';
const META_HEIGHT_INNER = 68;
const META_HEIGHT_PADDING = 16;
const META_HEIGHT = META_HEIGHT_INNER + META_HEIGHT_PADDING * 2;

export type PlanContextLoader = (plan: AssetInfo<Plan>) => { loading: boolean; blocks: AssetInfo<BlockDefinition>[] };

export type AssetMetaStatInfo = {
    label: string;
    color: BadgeTypeMap['props']['color'];
};

interface InnerProps {
    asset: AssetInfo<SchemaKind>;
    width: number;
    height: number;
    installerService?: InstallerService;
    loadPlanContext: PlanContextLoader;
    stats?: AssetMetaStatInfo[];
    onClick?: (asset: AssetInfo<SchemaKind>) => void;
}

export const AssetThumbnailContainer = forwardRef<HTMLDivElement, InnerProps & PropsWithChildren>((props, ref) => {
    const title = props.asset.content.metadata.title ?? props.asset.content.metadata.name;

    const [deleting, setDeleting] = useState(false);
    const confirm = useConfirm();

    return (
        <Stack
            ref={ref}
            className={CONTAINER_CLASS}
            onClick={() => props.onClick?.(props.asset)}
            direction={'column'}
            gap={0}
            sx={{
                transition: (theme) =>
                    theme.transitions.create('all', {
                        duration: theme.transitions.duration.short,
                    }),
                cursor: props.onClick ? 'pointer' : undefined,
                width: `${props.width}px`,
                height: `${props.height}px`,
                borderRadius: '10px',
                border: '1px solid rgba(69, 90, 100, 0.50)',
                bgcolor: '#ECEEF2',
                '&:hover': {
                    boxShadow: 3,
                },
                '& > .preview': {
                    position: 'relative',
                    overflow: 'hidden',
                },
            }}
        >
            <Box className={'preview'} flex={1}>
                {props.installerService?.uninstall && (
                    <Chip
                        label={deleting ? <CircularProgress size={24} /> : <Delete />}
                        variant={'filled'}
                        color={'default'}
                        onClick={async (evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            if (!props.installerService?.uninstall) {
                                return;
                            }
                            try {
                                await confirm({
                                    title: 'Uninstall asset',
                                    content: `
                                    Are you sure you want to uninstall ${title}?
                                    This will not delete anything from your disk.
                                    `,
                                    confirmationText: 'Uninstall',
                                });

                                setDeleting(true);
                                await props.installerService.uninstall(props.asset.ref);
                            } catch (e) {
                                // Ignore
                            } finally {
                                setDeleting(false);
                            }
                        }}
                        sx={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            zIndex: 1,
                            border: '1px solid #263238',
                            color: '#263238',
                            '& > .MuiChip-label': {
                                p: '0 4px',
                                width: '24px',
                                height: '24px',
                            },
                            '&:hover': {
                                boxShadow: 2,
                                color: 'error.contrastText',
                                bgcolor: 'error.main',
                            },
                        }}
                    />
                )}
                {props.children}
            </Box>
            <Stack
                className={'metadata'}
                direction={'row'}
                p={`${META_HEIGHT_PADDING}px`}
                gap={1}
                sx={{
                    bgcolor: '#263238',
                    color: 'white',
                    borderRadius: '0 0 10px 10px',
                    margin: '0 -1px -1px -1px',
                    minHeight: `${META_HEIGHT_INNER}px`,
                    height: `${META_HEIGHT_INNER}px`,
                    maxHeight: `${META_HEIGHT_INNER}px`,
                }}
            >
                <AssetKindIcon asset={props.asset.content} size={24} />
                <Box flex={1}>
                    <Typography mb={'4px'} fontSize={'16px'} fontWeight={700} lineHeight={'24px'} variant={'h6'}>
                        {title}
                    </Typography>
                    <Typography color={'#eeeeee'} fontSize={12} fontWeight={400} variant={'caption'}>
                        {props.asset.version}
                    </Typography>
                    {props.asset.lastModified && props.asset.lastModified > 0 && (
                        <Typography
                            color={'#eeeeee'}
                            fontSize={12}
                            fontWeight={400}
                            variant={'caption'}
                            sx={{
                                display: 'block',
                            }}
                        >
                            Edited <DateDisplay date={props.asset.lastModified} />
                        </Typography>
                    )}
                </Box>
                {props.stats?.length && (
                    <Box>
                        {props.stats.map((stat, index) => {
                            return (
                                <Typography
                                    key={index}
                                    fontSize={'12px'}
                                    lineHeight={'20px'}
                                    sx={(theme) => ({
                                        '& > .dot': {
                                            backgroundColor: theme.palette[stat.color ?? 'primary'].main,
                                            borderRadius: '50%',
                                            width: '8px',
                                            height: '8px',
                                            display: 'inline-block',
                                            mr: '4px',
                                        },
                                    })}
                                >
                                    <span className={'dot'} />
                                    {stat.label}
                                </Typography>
                            );
                        })}
                    </Box>
                )}
            </Stack>
        </Stack>
    );
});

const InnerPreview = (props: InnerProps) => {
    const kind = props.asset.content.kind;
    try {
        switch (kind) {
            case CoreTypes.PLAN:
                const context = props.loadPlanContext(props.asset as AssetInfo<Plan>);
                return (
                    <SimpleLoader loading={context.loading}>
                        {!context.loading && (
                            <PlanPreview
                                asset={props.asset}
                                width={props.width}
                                height={props.height}
                                blocks={context.blocks}
                            />
                        )}
                    </SimpleLoader>
                );
            case CoreTypes.BLOCK_TYPE:
            case CoreTypes.BLOCK_TYPE_OPERATOR:
                return (
                    <BlockTypePreview
                        width={props.width}
                        height={props.height}
                        blockType={BlockTypeProvider.get(props.asset.ref)}
                    />
                );
            case CoreTypes.PROVIDER_INTERNAL:
            case CoreTypes.PROVIDER_OPERATOR:
            case CoreTypes.PROVIDER_EXTENSION:
                return (
                    <ResourceTypePreview
                        width={props.width}
                        height={props.height}
                        resourceType={ResourceTypeProvider.get(props.asset.ref)}
                    />
                );
            default:
                if (kind.startsWith('core/')) {
                    return <AssetKindIcon size={Math.min(props.width, props.height)} asset={props.asset.content} />;
                }

                return (
                    <BlockPreview
                        width={props.width}
                        height={props.height}
                        resources={true}
                        block={props.asset.content}
                        blockType={BlockTypeProvider.get(props.asset.content.kind)}
                    />
                );
        }
    } catch (e) {
        console.warn('Failed to render preview', e);
        return <AssetKindIcon size={Math.min(props.width, props.height)} asset={props.asset.content} />;
    }
};

interface Props extends InnerProps {
    hideMetadata?: boolean;
}

export const AssetThumbnail = forwardRef<HTMLDivElement, Props>((props, ref) => {
    if (props.hideMetadata) {
        return (
            <Box
                ref={ref}
                className={CONTAINER_CLASS}
                sx={{
                    position: 'relative',
                    textAlign: 'center',
                }}
            >
                <InnerPreview {...props} height={props.height} />
            </Box>
        );
    }
    return (
        <AssetThumbnailContainer ref={ref} {...props}>
            <InnerPreview {...props} height={props.height - META_HEIGHT} />
        </AssetThumbnailContainer>
    );
});
