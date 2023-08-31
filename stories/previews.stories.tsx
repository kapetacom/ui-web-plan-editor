import React from 'react';

import { useAsync } from 'react-use';
import { PlanPreview } from '../src/components/PlanPreview';
import './data/BlockServiceMock';
import { BlockService, BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockPreview, BlockTypePreview } from '../src/components/BlockTypePreview';
import { ResourceTypePreview } from '../src/components/ResourceTypePreview';
import { readPlanV2 } from './data/planReader';
import { AssetThumbnail, fromAsset } from '../src';
import { DefaultContext } from '@kapeta/ui-web-components';
import { Asset } from '@kapeta/ui-web-types';

export default {
    title: 'Previews',
};
const WIDTH = 500;
const HEIGHT = 300;
const TempPreviewContainer = ({ children }: any) => {
    return (
        <div
            style={{
                border: '1px solid black',
                backgroundColor: '#eee',
                borderRadius: '10px',
                width: `${WIDTH}px`,
                height: `${HEIGHT}px`,
                boxSizing: 'border-box',
                margin: '10px',
                padding: '10px',
            }}
        >
            {children}
        </div>
    );
};

export const Plan = () => {
    const plan = useAsync(() => readPlanV2());

    return (
        <TempPreviewContainer>
            {plan.value ? (
                <PlanPreview
                    width={WIDTH - 20}
                    height={HEIGHT - 20}
                    blocks={plan.value.blockAssets || []}
                    asset={{
                        ref: 'kapeta/something:local',
                        version: 'local',
                        editable: true,
                        exists: true,
                        content: plan.value.plan,
                    }}
                />
            ) : (
                <div>Loading...</div>
            )}
        </TempPreviewContainer>
    );
};

export const BlockType = () => {
    const data = useAsync(async () => {
        return BlockTypeProvider.get('kapeta/block-type-frontend:1.2.3');
    });

    return (
        <TempPreviewContainer>
            {data.value ? (
                <BlockTypePreview blockType={data.value} width={WIDTH - 20} height={HEIGHT - 20} />
            ) : (
                <div>Loading...</div>
            )}
        </TempPreviewContainer>
    );
};

export const Block = () => {
    const data = useAsync(async () => {
        const block = await BlockService.get('kapeta/user:local');
        const blockType = BlockTypeProvider.get(block.data.kind);

        return {
            block,
            blockType,
        };
    });

    return (
        <TempPreviewContainer>
            {data.value ? (
                <BlockPreview
                    block={data.value.block.data}
                    blockType={data.value.blockType}
                    resources={true}
                    width={WIDTH - 20}
                    height={HEIGHT - 20}
                />
            ) : (
                <div>Loading...</div>
            )}
        </TempPreviewContainer>
    );
};

export const BlockNoResources = () => {
    const data = useAsync(async () => {
        const block = await BlockService.get('kapeta/user:local');
        const blockType = BlockTypeProvider.get(block.data.kind);

        return {
            block,
            blockType,
        };
    });

    return (
        <TempPreviewContainer>
            {data.value ? (
                <BlockPreview
                    block={data.value.block.data}
                    blockType={data.value.blockType}
                    resources={false}
                    width={WIDTH - 20}
                    height={HEIGHT - 20}
                />
            ) : (
                <div>Loading...</div>
            )}
        </TempPreviewContainer>
    );
};

export const ResourceType = () => {
    const data = useAsync(async () => {
        return ResourceTypeProvider.get('kapeta/resource-type-mongodb:1.2.3');
    });

    return (
        <TempPreviewContainer>
            {data.value ? (
                <ResourceTypePreview resourceType={data.value} width={WIDTH - 20} height={HEIGHT - 20} />
            ) : (
                <div>Loading...</div>
            )}
        </TempPreviewContainer>
    );
};

export const ThumbnailPlan = () => {
    const plan = useAsync(() => readPlanV2());

    if (!plan.value) {
        return <div>Loading...</div>;
    }

    return (
        <DefaultContext>
            <AssetThumbnail
                asset={{
                    content: plan.value.plan,
                    ref: 'kapeta/something:local',
                    version: 'local',
                    editable: true,
                    exists: true,
                }}
                width={400}
                height={400}
                onClick={() => {}}
                installerService={{
                    uninstall: () => Promise.resolve(),
                    install: () => Promise.resolve(),
                    get: () => Promise.resolve(true),
                }}
                loadPlanContext={() => {
                    return {
                        loading: false,
                        blocks: plan.value?.blockAssets || [],
                    };
                }}
            />
        </DefaultContext>
    );
};

export const ThumbnailBlock = () => {
    const data = useAsync(async () => {
        const block = await BlockService.get('kapeta/user:local');
        const blockType = BlockTypeProvider.get(block.data.kind);

        return {
            block,
            blockType,
        };
    });

    if (!data.value) {
        return <div>Loading...</div>;
    }

    return (
        <DefaultContext>
            <AssetThumbnail
                asset={fromAsset(data.value.block)}
                width={400}
                height={400}
                onClick={() => {}}
                installerService={{
                    uninstall: () => Promise.resolve(),
                    install: () => Promise.resolve(),
                    get: () => Promise.resolve(true),
                }}
                loadPlanContext={() => {
                    return {
                        loading: false,
                        blocks: [],
                    };
                }}
            />
        </DefaultContext>
    );
};
