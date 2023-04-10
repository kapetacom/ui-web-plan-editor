import React from 'react';

import { InstanceStatus } from '@kapeta/ui-web-context';

import { PlannerBlockModelWrapper, PlannerBlockNode, PlannerModelWrapper, PlannerNodeSize } from '../src';
import {AssetReference, BlockDefinition, BlockInstance } from '@kapeta/schemas';

const InvalidTargetRefDefinition: BlockDefinition = {
    kind: 'kapeta/block-type-service:1.2.3',
    metadata: {
        name: 'test/demo',
    },
    spec: {
        target: {
            kind: 'my-target',
        },
        consumers: [],
        providers: [],
    },
};

const MissingTargetRefDefinition: BlockDefinition = {
    kind: 'kapeta/block-type-service:1.2.3',
    metadata: {
        name: 'test/demo',
    },
    spec: {
        target: {
            kind: 'kapeta/my-target:1.2.3',
        },
        consumers: [],
        providers: [],
    },
};

const InvalidKindDefinition: BlockDefinition = {
    kind: 'kapeta/not-real:1.2.3',
    metadata: {
        name: 'test/demo',
    },
    spec: {
        target: {
            kind: 'my-target',
        },
        consumers: [],
        providers: [],
    },
};

const InvalidRefInstance: BlockInstance = {
    id: '1',
    name: 'Some Instance',
    block: {
        ref: 'some-ref',
    },
    dimensions: {
        top: 0,
        width: 150,
        left: 0,
        height: -1,
    },
};

const MissingRefInstance: BlockInstance = {
    id: '1',
    name: 'Some Instance',
    block: {} as AssetReference,
    dimensions: {
        top: 0,
        width: 150,
        left: 0,
        height: -1,
    },
};

const ValidInstance: BlockInstance = {
    id: '1',
    name: 'Some Instance',
    block: {
        ref: 'kapeta/some-ref:1.2.3',
    },
    dimensions: {
        top: 0,
        width: 150,
        left: 0,
        height: -1,
    },
};

export default {
    title: 'Blocks',
    parameters: {
        layout: 'fullscreen',
    },
};

export const BlockInvalidInstanceReference = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(InvalidRefInstance, InvalidTargetRefDefinition, somePlan);
    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockNode size={PlannerNodeSize.FULL} zoom={1} status={InstanceStatus.STOPPED} block={block} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...block.errors].join('\n')}</pre>
        </div>
    );
};

export const BlockMissingInstanceReference = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(MissingRefInstance, InvalidTargetRefDefinition, somePlan);
    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockNode size={PlannerNodeSize.FULL} zoom={1} status={InstanceStatus.STOPPED} block={block} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...block.errors].join('\n')}</pre>
        </div>
    );
};

export const BlockInvalidKindDefinition = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(ValidInstance, InvalidKindDefinition, somePlan);
    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockNode size={PlannerNodeSize.FULL} zoom={1} status={InstanceStatus.STOPPED} block={block} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...block.errors].join('\n')}</pre>
        </div>
    );
};

export const BlockInvalidTargetRefDefinition = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(ValidInstance, InvalidTargetRefDefinition, somePlan);
    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockNode size={PlannerNodeSize.FULL} zoom={1} status={InstanceStatus.STOPPED} block={block} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...block.errors].join('\n')}</pre>
        </div>
    );
};

export const BlockMissingTargetRefDefinition = () => {
    const somePlan: PlannerModelWrapper = new PlannerModelWrapper('test-plan', 'Some Plan');
    const block = new PlannerBlockModelWrapper(ValidInstance, MissingTargetRefDefinition, somePlan);
    return (
        <div style={{ position: 'relative' }}>
            <PlannerBlockNode size={PlannerNodeSize.FULL} zoom={1} status={InstanceStatus.STOPPED} block={block} />
            <pre style={{ left: 200, position: 'absolute' }}>{['Errors:', ...block.errors].join('\n')}</pre>
        </div>
    );
};
