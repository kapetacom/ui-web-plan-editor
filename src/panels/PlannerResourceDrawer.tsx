import React, {useMemo} from 'react';
import {Box, Button, Divider, Paper, Stack, Typography} from "@mui/material";
import {BlockTypeProvider, ResourceTypeProvider} from "@kapeta/ui-web-context";
import {IResourceTypeProvider, ItemType, ResourceRole} from "@kapeta/ui-web-types";
import {ResourceToolList} from "./tools/ResourceToolList";
import {BlockTypeToolList} from "./tools/BlockTypeToolList";

const HEADER_SIZE = '14px';

interface Props {
    onShowMoreAssets?: () => void
}

export const PlannerResourceDrawer = (props: Props) => {

    const {
        consumerResources,
        providerResources
    } = useMemo(() => {
        const consumerResources:IResourceTypeProvider[] = [];
        const providerResources:IResourceTypeProvider[] = [];
        ResourceTypeProvider.list().forEach((resource, ix) => {
            if (resource.role === ResourceRole.PROVIDES) {
                providerResources.push(resource);
            } else {
                consumerResources.push(resource);
            }
        })

        return {
            consumerResources,
            providerResources
        }
    }, []);

    const blockTypes = useMemo(() => {
        return BlockTypeProvider.list()
    },[]);

    return (
        <Paper
            className={'planner-resource-drawer'}
            square={true}
            variant={'elevation'}
            sx={{
                p: 2,
                width: 284,
                height: '100%',
                boxSizing: 'border-box',
                flexShrink: 0,
                overflowY: 'auto'
            }}
            elevation={2}>
            <Stack direction={'column'}>
                <Box className={'resources'}>
                    <Typography fontSize={HEADER_SIZE} fontWeight={700}>
                        Resources
                    </Typography>
                    <ResourceToolList title={'Consumers'} resources={consumerResources} />
                    <ResourceToolList title={'Providers'} resources={providerResources} />
                </Box>
                <Box className={'block-types'}>
                    <Typography fontSize={HEADER_SIZE} sx={{pt:1,pb:1}} fontWeight={700}>
                        Blocks
                    </Typography>
                    <BlockTypeToolList blockTypes={blockTypes} />
                </Box>
                {props.onShowMoreAssets &&
                    <Box sx={{
                        p: 5,
                        textAlign: 'center'
                    }}>
                        <Button size={'small'}
                                onClick={props.onShowMoreAssets}
                                variant={'outlined'}>
                            More assets
                        </Button>
                    </Box>}
            </Stack>
        </Paper>
    );
}