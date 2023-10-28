import React, { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { IResourceTypeProvider, ResourceRole } from '@kapeta/ui-web-types';
import { ResourceToolList } from './ResourceToolList';
import { BlockTypeToolList } from './BlockTypeToolList';
import { TipIcon } from '../../components/TipIcon';

const HEADER_SIZE = '14px';

interface Props {
    onShowMoreAssets?: () => void;
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
        <Box>
            <Box className="resources" data-kap-id={'plan-editor-resource-container'}>
                <ResourceToolList
                    title="Consumers"
                    dataKapId={'plan-editor-resource-consumers'}
                    description={'Drag consumers to your blocks to add dependencies on external resources.'}
                    readMoreLink={'https://docs.kapeta.com/docs/resource-types'}
                    resources={consumerResources}
                />
                <ResourceToolList
                    title="Providers"
                    dataKapId={'plan-editor-resource-providers'}
                    description={'Drag providers to your blocks to provide new functionality to your plan.'}
                    readMoreLink={'https://docs.kapeta.com/docs/resource-types'}
                    resources={providerResources}
                />
            </Box>
            <Box className="block-types" data-kap-id={'plan-editor-resource-block-types'}>
                <Typography fontSize={HEADER_SIZE} sx={{ pt: 1, pb: 1 }} fontWeight={700}>
                    Blocks
                    <TipIcon
                        readMoreLink={'https://docs.kapeta.com/docs/blocks'}
                        content="Blocks are used to build your plan. Drag and drop blocks to the canvas to create a new one."
                    />
                </Typography>
                <BlockTypeToolList blockTypes={blockTypes} />
            </Box>
            {props.onShowMoreAssets && (
                <Box
                    data-kap-id={'plan-editor-resource-show-more'}
                    sx={{
                        p: 5,
                        textAlign: 'center',
                    }}
                >
                    <Button size="small" onClick={props.onShowMoreAssets} variant="outlined">
                        More assets
                    </Button>
                </Box>
            )}
        </Box>
    );
};
