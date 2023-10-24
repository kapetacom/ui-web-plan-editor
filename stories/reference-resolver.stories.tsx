import React from 'react';
import './styles.less';
import { ReferenceResolver, MissingReferenceResolution } from '../src/planner/reference-resolver';
import { MissingReference, ReferenceType } from '../src/planner/validation/PlanReferenceValidation';
import { BlockService } from './data/BlockServiceMock';
import { useAsync } from 'react-use';
import { fromAsset } from '../src/types';

export default {
    title: 'Reference Resolver',
};

const createMissingReferences = (blockVersion: string): MissingReference[] => {
    return [
        {
            type: ReferenceType.KIND,
            blockRef: 'kapeta/user:' + blockVersion,
            ref: 'kapeta/block-type-frontend:1.2.0',
            instanceTitle: 'Frontend',
        },
        {
            type: ReferenceType.BLOCK,
            blockRef: 'kapeta/todo:' + blockVersion,
            ref: 'kapeta/todo-is-gone:1.2.3',
            instanceTitle: 'Todo',
        },
        {
            type: ReferenceType.BLOCK,
            blockRef: 'kapeta/todo:' + blockVersion,
            ref: 'kapeta/todo:1.2.0',
            instanceTitle: 'Todo',
        },
        {
            type: ReferenceType.CONSUMER,
            blockRef: 'kapeta/user:' + blockVersion,
            ref: 'kapeta/resource-type-mongodb:1.2.0',
            instanceTitle: 'User',
            referenceTitle: 'Users',
        },
        {
            type: ReferenceType.PROVIDER,
            blockRef: 'kapeta/todo:' + blockVersion,
            ref: 'kapeta/resource-type-rest-api:1.2.0',
            instanceTitle: 'Todo',
            referenceTitle: 'Tasks',
        },
        {
            type: ReferenceType.TARGET,
            blockRef: 'kapeta/user:' + blockVersion,
            ref: 'kapeta/language-target-java-spring-boot:2.2.0',
            instanceTitle: 'User',
        },
    ];
};

const assetCanBeInstalled = (ref: string) => {
    console.log('CAN INSTALL', ref);
    return new Promise<boolean>((resolve) => setTimeout(() => resolve(Math.random() >= 0.5), 1000 * Math.random()));
};
const installAsset = (ref: string) => {
    console.log('INSTALL', ref);
    return Promise.resolve();
};

const onChange = (resolution: MissingReferenceResolution[], valid: boolean) => {
    console.log('CHANGE', valid, resolution);
};

const onApply = (resolution: MissingReferenceResolution[]) => {
    console.log('APPLY', resolution);
};

const selectAssetFromDisk = async () => {
    return '/Users/someuser/KapetaProjects/someuser/my-local-asset/kapeta.yml';
};

export const ReadOnlyContext = () => {
    const blocks = useAsync(() => BlockService.list());
    return (
        <>
            {!blocks.loading && (
                <ReferenceResolver
                    blockAssets={blocks.value.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    installAsset={installAsset}
                    readOnly={true}
                    missingReferences={createMissingReferences('1.2.3')}
                    onChange={onChange}
                    onApply={onApply}
                    selectAssetFromDisk={selectAssetFromDisk}
                />
            )}
        </>
    );
};

export const WriteableContextReadOnlyBlocks = () => {
    const blocks = useAsync(() => BlockService.list());

    return (
        <>
            {!blocks.loading && (
                <ReferenceResolver
                    blockAssets={blocks.value.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    installAsset={installAsset}
                    readOnly={false}
                    missingReferences={createMissingReferences('1.2.3')}
                    onChange={onChange}
                    onApply={onApply}
                    selectAssetFromDisk={selectAssetFromDisk}
                />
            )}
        </>
    );
};

export const WriteableContext = () => {
    const blocks = useAsync(() => BlockService.list());

    return (
        <>
            {!blocks.loading && (
                <ReferenceResolver
                    blockAssets={blocks.value.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    installAsset={installAsset}
                    readOnly={false}
                    missingReferences={createMissingReferences('local')}
                    onChange={onChange}
                    onApply={onApply}
                    selectAssetFromDisk={selectAssetFromDisk}
                />
            )}
        </>
    );
};

export const MissingLocal = () => {
    const blocks = useAsync(() => BlockService.list());

    return (
        <>
            {!blocks.loading && (
                <ReferenceResolver
                    blockAssets={blocks.value.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    installAsset={installAsset}
                    readOnly={false}
                    onChange={onChange}
                    onApply={onApply}
                    selectAssetFromDisk={selectAssetFromDisk}
                    missingReferences={[
                        {
                            type: ReferenceType.BLOCK,
                            blockRef: 'kapeta/todo:local',
                            ref: 'kapeta/todo:local',
                        },
                        {
                            type: ReferenceType.TARGET,
                            blockRef: 'kapeta/todo:local',
                            ref: 'kapeta/language-target-java-spring-boot:local',
                        },
                    ]}
                />
            )}
        </>
    );
};
