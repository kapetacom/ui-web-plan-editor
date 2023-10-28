import React, { useEffect, useState } from 'react';

import { useAsync } from 'react-use';
import { PlanPreview } from '../src/components/PlanPreview';
import { BlockService } from './data/BlockServiceMock';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockPreview, BlockTypePreview } from '../src/components/BlockTypePreview';
import { ResourceTypePreview } from '../src/components/ResourceTypePreview';
import { readInvalidPlan, readPlanV2 } from './data/planReader';
import { AssetInfo, AssetThumbnail, fromAsset, MissingReference, ReferenceResolutionHandler } from '../src';
import { AssetInstallStatus, DefaultContext } from '@kapeta/ui-web-components';
import { Typography } from '@mui/material';
import { BlockDefinition, Plan } from '@kapeta/schemas';

import './styles.less';

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

export const PlanViewer = () => {
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

export const PlanMissingReferences = () => {
    const plan = useAsync(() => readInvalidPlan());

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
                    showResources
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
                    showResources={false}
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
                    get: () => Promise.resolve(AssetInstallStatus.INSTALLED),
                }}
                loadPlanContext={() => {
                    return {
                        loading: false,
                        blocks: plan.value?.blockAssets || [],
                    };
                }}
                stats={[
                    {
                        label: '1 pending',
                        color: 'primary',
                    },
                    {
                        label: '1 deployed',
                        color: 'success',
                    },
                    {
                        label: '1 failed',
                        color: 'error',
                    },
                    {
                        label: '1 expiring',
                        color: 'warning',
                        progress: 80,
                        pulsate: true,
                        tooltip: {
                            title: <Typography variant="body2">Some text about the expiring environment</Typography>,
                            placement: 'right',
                            arrow: true,
                            maxWidth: 500,
                        },
                    },
                ]}
            />
        </DefaultContext>
    );
};

function delayedPromise<T>(delay: number, value?: () => T): () => Promise<T> {
    // @ts-ignore
    return () => new Promise<T>((resolve) => setTimeout(() => resolve(value ? value() : null), Math.random() * delay));
}

export const ThumbnailPlanMissingAssets = () => {
    const planState = useAsync(() => readInvalidPlan());
    const [plan, setPlan] = useState<Plan>();
    const [blockAssets, setBlockAssets] = useState<AssetInfo<BlockDefinition>[]>();

    const [open, setOpen] = React.useState(false);
    const [missingReferences, setMissingReferences] = React.useState<MissingReference[]>([]);

    useEffect(() => {
        setPlan(planState.value?.plan);
        setBlockAssets(planState.value?.blockAssets);
    }, [planState.value]);

    if (!plan || !blockAssets) {
        return <div>Loading...</div>;
    }

    const installerService = {
        install: delayedPromise<void>(10000),
        import: delayedPromise<void>(10000),
        get: delayedPromise<AssetInstallStatus>(1000, () =>
            Math.random() > 0.5 ? AssetInstallStatus.INSTALLED : AssetInstallStatus.NOT_INSTALLED
        ),
    };

    return (
        <DefaultContext>
            <ReferenceResolutionHandler
                open={open}
                plan={plan}
                blockAssets={blockAssets}
                assetCanBeInstalled={async () => (await installerService.get()) !== AssetInstallStatus.INSTALLED}
                installAsset={() => installerService.install()}
                importAsset={() => installerService.import()}
                readOnly={false}
                missingReferences={missingReferences}
                onClose={() => setOpen(false)}
                onResolved={(result) => {
                    console.log('resolved', result);
                    if (result.plan) {
                        setPlan(result.plan);
                    }
                    if (result.blockAssets.length > 0) {
                        setBlockAssets((prev) => {
                            if (!prev) {
                                return [...result.blockAssets];
                            }
                            return prev.map((blockAsset) => {
                                return result.blockAssets.find((b) => b.ref === blockAsset.ref) ?? blockAsset;
                            });
                        });
                    }
                    setMissingReferences([]);
                }}
            />
            <AssetThumbnail
                asset={{
                    content: plan,
                    ref: 'kapeta/something:local',
                    version: 'local',
                    editable: true,
                    exists: true,
                }}
                width={400}
                height={400}
                onClick={() => {
                    if (missingReferences.length > 0) {
                        setOpen(true);
                    } else {
                        console.log('No missing references!');
                    }
                }}
                onMissingReferences={(references) => {
                    setMissingReferences(references);
                }}
                installerService={installerService}
                loadPlanContext={() => {
                    return {
                        loading: false,
                        blocks: blockAssets,
                    };
                }}
                stats={[
                    {
                        label: '1 pending',
                        color: 'primary',
                    },
                    {
                        label: '1 deployed',
                        color: 'success',
                    },
                    {
                        label: '1 failed',
                        color: 'error',
                    },
                    {
                        label: '1 expiring',
                        color: 'warning',
                        progress: 80,
                        pulsate: true,
                        tooltip: {
                            title: <Typography variant="body2">Some text about the expiring environment</Typography>,
                            placement: 'right',
                            arrow: true,
                            maxWidth: 500,
                        },
                    },
                ]}
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
                    get: () => Promise.resolve(AssetInstallStatus.INSTALLED),
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
