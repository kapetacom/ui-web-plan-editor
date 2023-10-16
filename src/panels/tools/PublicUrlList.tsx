import React, { useContext } from 'react';
import { Stack, Typography } from '@mui/material';
import { PlannerContext } from '../../planner/PlannerContext';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { withErrorBoundary } from 'react-error-boundary';
import { EmptyStateBox } from '@kapeta/ui-web-components';
import { BlockDefinition } from '@kapeta/schemas';

export const PublicUrlList = withErrorBoundary(
    (props: React.PropsWithChildren) => {
        const planner = useContext(PlannerContext);

        const blockDefinitions: Array<[string, BlockDefinition | undefined]> =
            planner.plan?.spec.blocks.map((block) => [block.id, planner.getBlockById(block.id)]) ?? [];
        const gateways = blockDefinitions
            .filter(
                ([blockId, block]) =>
                    !!block && parseKapetaUri(block.kind).fullName === 'kapeta/block-type-gateway-http'
            )
            .map(([blockId, block]) => ({
                title:
                    planner.plan?.spec.blocks.find((blockX) => blockX.id === blockId)?.name ||
                    block!.metadata.title ||
                    block!.metadata.title ||
                    blockId,
            }));

        return (
            <Stack gap={2} sx={{ py: 2 }}>
                <Typography>Public URLs will be available on all gateways in the plan.</Typography>

                {gateways.length ? (
                    gateways.map((gateway) => {
                        return <pre>{gateway.title}</pre>;
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
