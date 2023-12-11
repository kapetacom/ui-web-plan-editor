/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import './styles.less';
import { ReferenceResolver, MissingReferenceResolution } from '../src/planner/reference-resolver';
import { MissingReference, ReferenceType } from '../src/planner/validation/PlanReferenceValidation';
import { BlockService } from './data/BlockServiceMock';
import { useAsync } from 'react-use';
import { fromAsset } from '../src/types';
import { ReferenceResolutionHandler } from '../src/planner/reference-resolver/ReferenceResolutionHandler';
import { InvalidPlannerData } from './data/PlannerData';

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
        {
            type: ReferenceType.TARGET,
            blockRef: 'kapeta/todo:' + blockVersion,
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
    return new Promise<void>((resolve) => setTimeout(resolve, 3000 * Math.random()));
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
                    plan={InvalidPlannerData}
                    blockAssets={blocks.value!.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    readOnly={true}
                    missingReferences={createMissingReferences('1.2.3')}
                    onChange={onChange}
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
                    plan={InvalidPlannerData}
                    blockAssets={blocks.value!.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    readOnly={false}
                    missingReferences={createMissingReferences('1.2.3')}
                    onChange={onChange}
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
                    plan={InvalidPlannerData}
                    blockAssets={blocks.value!.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    readOnly={false}
                    missingReferences={createMissingReferences('local')}
                    onChange={onChange}
                    selectAssetFromDisk={selectAssetFromDisk}
                />
            )}
        </>
    );
};

export const WriteableContextModal = () => {
    const blocks = useAsync(() => BlockService.list());

    return (
        <>
            {!blocks.loading && (
                <ReferenceResolutionHandler
                    plan={InvalidPlannerData}
                    open={true}
                    onClose={() => {}}
                    blockAssets={blocks.value!.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    installAsset={installAsset}
                    readOnly={false}
                    missingReferences={createMissingReferences('local')}
                    selectAssetFromDisk={selectAssetFromDisk}
                />
            )}
        </>
    );
};

export const WriteableContextAllInstallModal = () => {
    const blocks = useAsync(() => BlockService.list());

    return (
        <>
            {!blocks.loading && (
                <ReferenceResolutionHandler
                    plan={InvalidPlannerData}
                    open
                    onClose={() => {}}
                    blockAssets={blocks.value!.map(fromAsset)}
                    assetCanBeInstalled={(ref) => Promise.resolve(true)}
                    installAsset={installAsset}
                    readOnly={false}
                    missingReferences={createMissingReferences('local')}
                    selectAssetFromDisk={selectAssetFromDisk}
                    importAsset={() => Promise.resolve('kapeta/other:local')}
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
                <ReferenceResolutionHandler
                    plan={InvalidPlannerData}
                    blockAssets={blocks.value!.map(fromAsset)}
                    assetCanBeInstalled={assetCanBeInstalled}
                    readOnly={false}
                    onClose={() => {}}
                    open
                    selectAssetFromDisk={selectAssetFromDisk}
                    importAsset={() => Promise.resolve('kapeta/other:local')}
                    missingReferences={[
                        {
                            type: ReferenceType.BLOCK,
                            blockRef: 'kapeta/todo:local',
                            ref: 'kapeta/todo:local',
                            instanceId: InvalidPlannerData.spec.blocks[0].id,
                        },
                        {
                            type: ReferenceType.TARGET,
                            blockRef: 'kapeta/todo:local',
                            ref: 'kapeta/language-target-java-spring-boot:local',
                            instanceId: InvalidPlannerData.spec.blocks[0].id,
                        },
                    ]}
                />
            )}
        </>
    );
};

export const CanNotResolve = () => {
    const blocks = useAsync(() => BlockService.list());

    return (
        <>
            {!blocks.loading && (
                <ReferenceResolutionHandler
                    plan={InvalidPlannerData}
                    blockAssets={blocks.value!.map(fromAsset)}
                    assetCanBeInstalled={() => Promise.resolve(false)}
                    readOnly
                    onClose={() => {}}
                    open
                    importAsset={() => Promise.resolve(null)}
                    selectAssetFromDisk={selectAssetFromDisk}
                    missingReferences={[
                        {
                            type: ReferenceType.BLOCK,
                            blockRef: 'not-kapeta/todo:3.2.1',
                            ref: 'not-kapeta/todo:3.2.1',
                        },
                        {
                            type: ReferenceType.TARGET,
                            blockRef: 'kapeta/todo:1.2.3',
                            ref: 'not-kapeta/language-target-java-spring-boot:3.2.1',
                        },
                    ]}
                />
            )}
        </>
    );
};
