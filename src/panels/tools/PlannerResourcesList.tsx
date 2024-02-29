/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useMemo } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { IResourceTypeProvider, ResourceRole } from '@kapeta/ui-web-types';
import { ResourceToolList } from './ResourceToolList';
import { BlockTypeToolList } from './BlockTypeToolList';
import { TipIcon } from '../../components/TipIcon';
import { Add } from '@mui/icons-material';
import { Tooltip } from '@kapeta/ui-web-components';

const HEADER_SIZE = '14px';

interface Props {
    onShowMoreAssets?: () => void;
    onBlockImport?: () => void;
}

export const PlannerResourcesList = (props: Props) => {
    const { consumerResources, providerResources } = useMemo(() => {
        const consumerResources: IResourceTypeProvider[] = [];
        const providerResources: IResourceTypeProvider[] = [];
        ResourceTypeProvider.list().forEach((resource, ix) => {
            if (resource.role === ResourceRole.PROVIDES) {
                providerResources.push(resource);
            } else {
                consumerResources.push(resource);
            }
        });

        return {
            consumerResources,
            providerResources,
        };
    }, []);

    const blockTypes = useMemo(() => {
        return BlockTypeProvider.list();
    }, []);

    return (
        <Stack gap={4} sx={{ py: 3 }}>
            <Stack className="resources" data-kap-id="plan-editor-resource-container" gap={2}>
                <Typography
                    fontSize={HEADER_SIZE}
                    fontWeight={700}
                    sx={{ display: 'inline-flex', alignItems: 'center' }}
                >
                    Resources
                    <TipIcon
                        readMoreLink="https://docs.kapeta.com/docs/blocks#resources"
                        content="Resources are plugins you can use to define what your block requires to function. Drag and drop a resource to a block to connect it."
                    />
                </Typography>
                <ResourceToolList
                    title="Consumers"
                    dataKapId="plan-editor-resource-consumers"
                    description="Drag consumers to your blocks to add dependencies on external resources."
                    readMoreLink="https://docs.kapeta.com/docs/resource-types"
                    resources={consumerResources}
                />
                <ResourceToolList
                    title="Providers"
                    dataKapId="plan-editor-resource-providers"
                    description="Drag providers to your blocks to provide new functionality to your plan."
                    readMoreLink="https://docs.kapeta.com/docs/resource-types"
                    resources={providerResources}
                />
            </Stack>
            <Stack className="block-types" data-kap-id="plan-editor-resource-block-types" gap={2}>
                <Stack direction={'row'} justifyContent={'space-between'}>
                    <Typography
                        fontSize={HEADER_SIZE}
                        fontWeight={700}
                        sx={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                        Blocks
                        <TipIcon
                            readMoreLink="https://docs.kapeta.com/docs/blocks"
                            content="Blocks are used to build your plan. Drag and drop blocks to the canvas to create a new one."
                        />
                    </Typography>
                    {props.onBlockImport && (
                        <Box sx={{ ml: 1 }}>
                            <Tooltip title={'Import block from your hard drive'} placement="right">
                                <IconButton
                                    size="small"
                                    sx={{
                                        width: '22px',
                                        height: '22px',
                                        '& .MuiSvgIcon-root': {
                                            fontSize: '16px',
                                        },
                                    }}
                                    color={'primary'}
                                    onClick={props.onBlockImport}
                                    data-kap-id="resources-import-block"
                                >
                                    <Add />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Stack>

                <BlockTypeToolList blockTypes={blockTypes} />
            </Stack>
            {props.onShowMoreAssets && (
                <Box
                    data-kap-id="plan-editor-resource-show-more"
                    sx={{
                        p: 2,
                        textAlign: 'center',
                    }}
                >
                    <Button
                        size="small"
                        onClick={props.onShowMoreAssets}
                        variant="outlined"
                        data-kap-id="resources-open-blockhub"
                    >
                        More assets
                    </Button>
                </Box>
            )}
        </Stack>
    );
};
