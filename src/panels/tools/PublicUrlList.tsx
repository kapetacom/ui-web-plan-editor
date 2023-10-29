/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext } from 'react';
import { Stack, Typography } from '@mui/material';
import { PlannerContext } from '../../planner/PlannerContext';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { withErrorBoundary } from 'react-error-boundary';
import { EmptyStateBox } from '@kapeta/ui-web-components';
import { BlockDefinition } from '@kapeta/schemas';
import { GatewayCard } from '../../components/GatewayCard';

interface PublicUrlListProps {
    onConfigureGateway: (blockId: string) => void;
}

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
                        return <GatewayCard title={gateway.title} />;
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
