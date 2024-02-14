/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { forwardRef, useCallback, useState } from 'react';
import { Box, CircularProgress, IconButton, Stack, SvgIconProps, Typography, alpha } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { SchemaKind } from '@kapeta/ui-web-types';
import {
    DateDisplay,
    getNameForKind,
    InstallerService,
    PieChartIcon,
    Tooltip,
    TooltipProps,
} from '@kapeta/ui-web-components';
import { AssetKindIcon, CoreTypes, SimpleLoader, useConfirm } from '@kapeta/ui-web-components';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockDefinition, Plan } from '@kapeta/schemas';

import { PlanPreview } from './PlanPreview';
import { BlockPreview, BlockTypePreview } from './BlockTypePreview';
import { ResourceTypePreview } from './ResourceTypePreview';
import { AssetInfo } from '../types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { MissingReference } from '../planner/validation/PlanReferenceValidation';

const CONTAINER_CLASS = 'asset-thumbnail';
const META_HEIGHT_INNER = 68;
const META_HEIGHT_PADDING = 16;
const META_HEIGHT = META_HEIGHT_INNER + META_HEIGHT_PADDING * 2;

export type PlanContextLoader = (plan: AssetInfo<Plan>) => { loading: boolean; blocks: AssetInfo<BlockDefinition>[] };

export type AssetMetaStat = {
    label: string;
    color: SvgIconProps['color'];
    progress?: number;
    pulsate?: boolean;
    tooltip?: Omit<TooltipProps, 'children'>;
};

interface AssetThumbnailInnerPreviewProps {
    asset: AssetInfo<SchemaKind>;
    width: number;
    height: number;
    installerService?: InstallerService;
    subscription?: boolean;
    loadPlanContext: PlanContextLoader;
    stats?: AssetMetaStat[];
    onClick?: (asset: AssetInfo<SchemaKind>) => void;
    onMissingReferences?: (references: MissingReference[]) => void;
}

interface AssetThumbnailContainerProps extends AssetThumbnailInnerPreviewProps {
    children: React.ReactNode;
}

export const AssetThumbnailContainer = forwardRef<HTMLDivElement, AssetThumbnailContainerProps>((props, ref) => {
    const title = props.asset.content.metadata.title ?? props.asset.content.metadata.name;

    const uri = parseKapetaUri(props.asset.content.metadata.name);

    const [deleting, setDeleting] = useState(false);
    const confirm = useConfirm();

    const kindNameLC = getNameForKind(props.asset.content.kind).toLowerCase();

    const onDelete: React.MouseEventHandler<HTMLButtonElement> = useCallback(
        async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!props.installerService?.uninstall) {
                return;
            }
            if (
                await confirm({
                    title: props.subscription ? `Remove ${kindNameLC}` : `Uninstall ${kindNameLC}`,
                    content: props.subscription
                        ? `Are you sure you want to remove ${title}?
                                    This will also remove all environments for this plan.`
                        : `Are you sure you want to uninstall ${title}?
                                    This will not delete anything from your disk.`,
                    confirmationText: props.subscription ? 'Remove' : 'Uninstall',
                })
            ) {
                try {
                    setDeleting(true);
                    await props.installerService.uninstall(props.asset.ref);
                } catch (e) {
                    // Ignore
                } finally {
                    setDeleting(false);
                }
            }
        },
        [confirm, kindNameLC, props.asset.ref, props.installerService, props.subscription, title]
    );

    return (
        <Stack
            ref={ref}
            className={CONTAINER_CLASS}
            onClick={() => props.onClick?.(props.asset)}
            direction="column"
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
                    '.asset-thumbnail-delete-button': {
                        color: (theme) => theme.palette.text.secondary,
                        backgroundColor: (theme) => alpha(theme.palette.text.secondary, 0.04),
                    },
                },
                '& > .preview': {
                    position: 'relative',
                    overflow: 'hidden',
                },
                '*': {
                    boxSizing: 'content-box',
                },
            }}
        >
            <Box className="preview" flex={1}>
                {props.installerService?.uninstall && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                        }}
                    >
                        {deleting ? (
                            <>
                                <CircularProgress size={30} color="error" sx={{ position: 'absolute' }} thickness={2} />
                                <ClearIcon fontSize="small" color="error" />
                            </>
                        ) : (
                            <IconButton
                                data-kap-id="asset-thumbnail-delete-button"
                                className="asset-thumbnail-delete-button"
                                size="small"
                                onClick={onDelete}
                                sx={{
                                    transition: 'background-color 0.2s ease-in-out',
                                    color: (theme) => theme.palette.text.disabled,
                                    '&&:hover': {
                                        color: (theme) => theme.palette.error.main,
                                        backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08),
                                    },
                                }}
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                )}
                {props.children}
            </Box>
            <Stack
                className="metadata"
                direction="row"
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
                    <Typography mb="4px" fontSize="16px" fontWeight={700} lineHeight="24px" variant="h6">
                        {title}
                    </Typography>
                    <Typography color="#eeeeee" fontSize={12} fontWeight={400} variant="caption">
                        {props.asset.version} by {uri.handle}
                    </Typography>
                    {props.asset.lastModified && props.asset.lastModified > 0 && (
                        <Typography
                            color="#eeeeee"
                            fontSize={12}
                            fontWeight={400}
                            variant="caption"
                            sx={{
                                display: 'block',
                            }}
                        >
                            Edited <DateDisplay date={props.asset.lastModified} />
                        </Typography>
                    )}
                </Box>
                {props.stats?.length ? (
                    <Box>
                        {props.stats.map((stat, index) => {
                            const renderedStat = (
                                <Typography
                                    key={stat.label}
                                    variant="body2"
                                    display="flex"
                                    alignItems="center"
                                    sx={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}
                                >
                                    <PieChartIcon
                                        value={stat.progress ?? 100}
                                        color={stat.color}
                                        sx={{ fontSize: '10px', mr: 1 }}
                                        pulsate={stat.pulsate}
                                    />
                                    {stat.label}
                                </Typography>
                            );

                            return stat.tooltip ? (
                                <Tooltip key={stat.label} {...stat.tooltip}>
                                    {renderedStat}
                                </Tooltip>
                            ) : (
                                renderedStat
                            );
                        })}
                    </Box>
                ) : null}
            </Stack>
        </Stack>
    );
});

const AssetThumbnailInnerPreview = (props: AssetThumbnailInnerPreviewProps) => {
    const kind = props.asset.content.kind;
    try {
        switch (kind) {
            case CoreTypes.PLAN: {
                const context = props.loadPlanContext(props.asset as AssetInfo<Plan>);
                return (
                    <SimpleLoader loading={context.loading}>
                        {!context.loading && (
                            <PlanPreview
                                asset={props.asset}
                                blocks={context.blocks}
                                onMissingReferences={props.onMissingReferences}
                            />
                        )}
                    </SimpleLoader>
                );
            }
            case CoreTypes.BLOCK_TYPE:
            case CoreTypes.BLOCK_TYPE_OPERATOR:
            case CoreTypes.BLOCK_TYPE_EXECUTABLE:
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
                        showResources
                        block={props.asset.content}
                        blockType={BlockTypeProvider.get(props.asset.content.kind)}
                    />
                );
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to render preview', e);
        return <AssetKindIcon size={Math.min(props.width, props.height)} asset={props.asset.content} />;
    }
};

interface AssetThumbnailProps extends AssetThumbnailInnerPreviewProps {
    hideMetadata?: boolean;
}

export const AssetThumbnail = forwardRef<HTMLDivElement, AssetThumbnailProps>((props, ref) => {
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
                <AssetThumbnailInnerPreview {...props} height={props.height} />
            </Box>
        );
    }
    return (
        <AssetThumbnailContainer ref={ref} {...props}>
            <AssetThumbnailInnerPreview {...props} height={props.height - META_HEIGHT} />
        </AssetThumbnailContainer>
    );
});
