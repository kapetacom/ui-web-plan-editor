/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { ForwardedRef, forwardRef, useContext } from 'react';
import { Meta, StoryObj } from '@storybook/react';

import { ButtonStyle, DefaultContext } from '@kapeta/ui-web-components';

import { Planner } from '../src/planner/Planner';

import { readInvalidPlan, readPlanV2, readWonkyPlan } from './data/planReader';
import { PlannerActionConfig, PlannerContext, withPlannerContext } from '../src/planner/PlannerContext';
import { useAsync } from 'react-use';
import { ItemType, ResourceRole, SchemaKind } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { ItemEditorPanel } from './helpers/ItemEditorPanel';
import { EditItemInfo, PlannerMode, getConnectionId } from '../src';
import { InstanceStatus } from '@kapeta/ui-web-context';

import { BlockDefinition, BlockInstance, Resource } from '@kapeta/schemas';
import { BlockInspectorPanel } from '../src/panels/BlockInspectorPanel';

import { useConfirmDelete } from '@kapeta/ui-web-components';
import { PlannerDrawer } from '../src/panels/PlannerDrawer';
import { Typography } from '@mui/material';

import './styles.less';
import { applyAutoLayout } from '../src/planner/auto-layout';
import { atom, useAtom } from 'jotai';

type ChatItem =
    | {
          type: 'plan';
      }
    | {
          type: 'screen';
          blockName: string;
      }
    | {
          type: 'block';
          blockName: string;
          blockRef: string;
          instanceId: string;
      }
    | {
          type: 'type';
          blockName: string;
          typeName: string;
          blockRef: string;
          instanceId: string;
      }
    | {
          type: 'api' | 'model';
          blockName: string;
          typeName: string;
          blockRef: string;
          instanceId: string;
          resourceName: string;
      }
    | {
          type: 'file';
          path: string;
      }
    | {
          type: 'connection';
          id: string;
      }
    | {
          type: 'none';
      };

const atomHoveredChatUI = atom<ChatItem>({
    type: 'none',
});

const atomHovered = atom(
    (get) => {
        return get(atomHoveredChatUI);
    },
    (get, set, item: ChatItem | null) => {
        set(atomHoveredChatUI, item ? { ...item } : { type: 'none' });
    }
);

const getResourceTypeFromKind = (kind: string): ChatItem['type'] | undefined => {
    if (kind.includes('rest-api') || kind.includes('rest-client')) {
        return 'api';
    }
    if (kind.includes('postgresql') || kind.includes('mongodb')) {
        return 'model';
    }
    if (kind.includes('web-page')) {
        return 'screen';
    }
    return undefined;
};

const InnerPlanEditor = forwardRef<HTMLDivElement, {}>((props: any, forwardedRef: ForwardedRef<HTMLDivElement>) => {
    const planner = useContext(PlannerContext);
    const [editItem, setEditItem] = React.useState<EditItemInfo | undefined>();
    const [inspectItem, setInspectItem] = React.useState<BlockInstance | null>(null);
    const [configureItem, setConfigureItem] = React.useState<SchemaKind<any, any> | null>(null);

    const confirmDelete = useConfirmDelete();

    const actionConfig: PlannerActionConfig = {
        block: [
            {
                enabled(): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick(context, action) {
                    setInspectItem(action.blockInstance!);
                },
                buttonStyle: ButtonStyle.PRIMARY,
                icon: 'fa fa-search',
                label: 'Inspect',
                warningInspector: true,
                kapId: 'inspect-block-instance',
            },
            {
                enabled(): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                async onClick(context, action) {
                    await new Promise((resolve) => setTimeout(resolve, 10000));
                },
                buttonStyle: ButtonStyle.PRIMARY,
                icon: 'fa fa-play',
                label: 'Test',
                kapId: 'test-button',
            },
            {
                enabled(context, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseKapetaUri(blockInstance.block.ref).version === 'local'
                    );
                },
                async onClick(context, { blockInstance }) {
                    const ok = await confirmDelete(
                        `Delete Block Instance`,
                        `Are you sure you want to delete ${blockInstance?.name || 'this block'}?`
                    );
                    if (ok) {
                        planner.removeBlockInstance(blockInstance!.id);
                    }
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
                kapId: 'delete-block-instance',
            },
            {
                enabled(context, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseKapetaUri(blockInstance.block.ref).version === 'local'
                    );
                },
                onClick(context, { blockInstance, block }) {
                    setEditItem({
                        type: ItemType.BLOCK,
                        item: { block: block!, instance: blockInstance! },
                        creating: false,
                    });
                },
                buttonStyle: ButtonStyle.SECONDARY,
                icon: 'fa fa-pencil',
                label: 'Edit',
                kapId: 'edit-block-instance',
            },
            {
                enabled(context, { blockInstance }): boolean {
                    return context.mode === PlannerMode.CONFIGURATION;
                },
                onClick(context, { block }) {
                    setConfigureItem(block!);
                },
                buttonStyle: ButtonStyle.DEFAULT,
                icon: 'fa fa-tools',
                label: 'Configure',
            },
        ],
        resource: [
            {
                enabled(context, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseKapetaUri(blockInstance.block.ref).version === 'local'
                    );
                },
                onClick(p, { resource, block, blockInstance }) {
                    setEditItem({
                        type: ItemType.RESOURCE,
                        item: {
                            resource: resource!,
                            block: block!,
                            ref: blockInstance!.block.ref,
                        },
                        creating: false,
                    });
                },
                buttonStyle: ButtonStyle.SECONDARY,
                icon: 'fa fa-pencil',
                label: 'Edit',
                kapId: 'edit-resource',
            },
            {
                enabled(context, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseKapetaUri(blockInstance.block.ref).version === 'local'
                    );
                },
                async onClick(context, { blockInstance, resource, resourceRole }) {
                    const ok = await confirmDelete(
                        `Delete Resource`,
                        `Are you sure you want to delete ${resource?.metadata.name || 'this resource'}?`
                    );
                    if (ok) {
                        context.removeResource(blockInstance!.block.ref, resource!.metadata.name, resourceRole!);
                    }
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
                kapId: 'delete-resource',
            },
        ],
        connection: [
            {
                enabled(context): boolean {
                    return planner.mode === PlannerMode.EDIT;
                },
                async onClick(context, { connection }) {
                    const provider = planner.getResourceByBlockIdAndName(
                        connection!.provider.blockId,
                        connection!.provider.resourceName,
                        ResourceRole.PROVIDES
                    );
                    const consumer = planner.getResourceByBlockIdAndName(
                        connection!.consumer.blockId,
                        connection!.consumer.resourceName,
                        ResourceRole.CONSUMES
                    );

                    const ok = await confirmDelete(
                        `Delete Connection?`,
                        `from ${provider?.metadata.name} to ${consumer?.metadata.name}?`
                    );

                    if (ok) {
                        planner.removeConnection(connection!);
                    }
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
                kapId: 'delete-connection',
            },
            {
                enabled(context): boolean {
                    return planner.mode === PlannerMode.EDIT;
                },
                onClick(context, { connection }) {
                    console.log('edit connection', connection);
                },
                buttonStyle: ButtonStyle.SECONDARY,
                icon: 'fa fa-pencil',
                label: 'Edit',
                kapId: 'edit-connection',
            },
        ],
    };

    planner.setHoveredChatUIAtom(atomHoveredChatUI);

    // const setHovered = useSetAtom(atomHovered);
    const [hovered, setHovered] = useAtom(atomHovered);

    return (
        <div ref={forwardedRef} className="plan-container">
            <PlannerDrawer>
                <Typography variant="body1" fontWeight={700} sx={{ mb: 1 }}>
                    Instructions
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    Hover the elements below and see them highlighted in the planner.
                </Typography>

                <Typography variant="body1" fontWeight={500} sx={{ mt: 4, mb: 1 }}>
                    Blocks
                </Typography>
                {planner.plan?.spec.blocks.map((block, index) => (
                    <Typography
                        key={`block_${index}`}
                        variant="body2"
                        sx={{ mb: 1 }}
                        onMouseEnter={() =>
                            setHovered({
                                type: 'block',
                                blockName: block.name,
                                blockRef: block.block.ref,
                                instanceId: block.id,
                            })
                        }
                        onMouseLeave={() => setHovered(null)}
                    >
                        {block.block.ref}
                    </Typography>
                ))}

                <Typography variant="body1" fontWeight={500} sx={{ mt: 4, mb: 1 }}>
                    Connections
                </Typography>
                {planner.plan?.spec.connections.map((connection, index) => (
                    <Typography
                        key={`connection_${index}`}
                        variant="body2"
                        sx={{ mb: 1 }}
                        onMouseEnter={() =>
                            setHovered({
                                type: 'connection',
                                id: getConnectionId(connection),
                            })
                        }
                        onMouseLeave={() => setHovered(null)}
                    >
                        {connection.provider.blockId} {'>'} {connection.consumer.blockId}
                    </Typography>
                ))}

                <Typography variant="body1" fontWeight={500} sx={{ mt: 4, mb: 1 }}>
                    Resources
                </Typography>
                {planner.plan?.spec.blocks.map((block, blockIdx) => {
                    const blockDef = planner.getBlockById(block.id);
                    const providers = blockDef?.spec?.providers || [];
                    const consumers = blockDef?.spec?.consumers || [];
                    const resources = providers.concat(consumers);
                    return resources.map((resource, resourceIdx) => {
                        const resourceType = getResourceTypeFromKind(resource.kind);

                        return resourceType ? (
                            <Typography
                                key={`block_${blockIdx}_resource_${resourceIdx}`}
                                variant="body2"
                                sx={{ mb: 1 }}
                                onMouseEnter={() => {
                                    switch (resourceType) {
                                        case 'api':
                                            setHovered({
                                                type: 'api',
                                                blockName: block.name,
                                                typeName: resource.metadata.name,
                                                blockRef: block.block.ref,
                                                instanceId: block.id,
                                                resourceName: resource.metadata.name,
                                            });
                                            break;
                                        case 'model':
                                            setHovered({
                                                type: 'model',
                                                blockName: block.name,
                                                typeName: resource.metadata.name,
                                                blockRef: block.block.ref,
                                                instanceId: block.id,
                                                resourceName: resource.metadata.name,
                                            });
                                            break;
                                        case 'screen':
                                            setHovered({
                                                type: 'screen',
                                                blockName: block.name,
                                            });
                                            break;
                                        default:
                                            // eslint-disable-next-line no-console
                                            console.error('unknown resource type', resourceType);
                                    }
                                }}
                                onMouseLeave={() => setHovered(null)}
                            >
                                {/* {JSON.stringify(resource)} */}
                                {resource.metadata.name}
                                <br />({resource.kind})
                            </Typography>
                        ) : null;
                    });
                })}

                <Typography variant="body1" fontWeight={500} sx={{ mt: 4, mb: 1 }}>
                    Hovered item
                </Typography>
                <Typography component="pre" fontSize={10} sx={{ border: '1px solid #e4e4e4', p: 2 }}>
                    {JSON.stringify(hovered, null, 2)}
                </Typography>
            </PlannerDrawer>

            <Planner
                systemId="kapeta/something:local"
                actions={actionConfig}
                onCreateBlock={(block, instance) => {
                    setEditItem({
                        creating: true,
                        item: { block, instance },
                        type: ItemType.BLOCK,
                    });
                }}
                showPixelGrid
                initialZoomPanView={{
                    autoFit: true,
                    transitionDuration: 0,
                }}
            />

            <ItemEditorPanel
                open={!!editItem}
                editableItem={editItem}
                onClose={() => {
                    if (editItem?.creating && editItem?.type === ItemType.BLOCK) {
                        planner.removeBlockInstance(editItem.item.instance.id);
                        planner.removeBlockDefinition({
                            ref: editItem.item.instance.block.ref,
                            content: editItem.item.block,
                            version: 'local',
                            exists: false,
                            lastModified: -1,
                        });
                        console.log('removing block definition');
                    }

                    setEditItem(undefined);
                }}
                onSubmit={(item) => {
                    if (editItem?.type === ItemType.BLOCK) {
                        planner.updateBlockDefinition(editItem.item.instance.block.ref, item as BlockDefinition);
                        setEditItem(undefined);
                    }

                    if (editItem?.type === ItemType.RESOURCE) {
                        const resource = editItem.item.resource as Resource;
                        const role = editItem.item.block?.spec?.consumers?.includes(resource)
                            ? ResourceRole.CONSUMES
                            : ResourceRole.PROVIDES;
                        if (editItem.creating) {
                            //     ???
                        } else {
                            // update mapping?
                            planner.updateResource(editItem.item.ref!, resource.metadata.name, role, item as Resource);
                        }
                    }
                }}
            />

            <BlockInspectorPanel
                open={!!inspectItem}
                configuration={{}}
                instance={inspectItem ?? undefined}
                onClosed={() => setInspectItem(null)}
            />
        </div>
    );
});

const PlanEditor = withPlannerContext(InnerPlanEditor);

const PlannerLoader = (props: { planId?: string; instanceStatus: InstanceStatus; plannerMode: PlannerMode }) => {
    const plan = useAsync(async () => {
        // eslint-disable-next-line no-nested-ternary
        const out = await (props.planId === 'invalid'
            ? readInvalidPlan()
            : props.planId === 'wonky'
            ? readWonkyPlan()
            : readPlanV2());

        out.plan = applyAutoLayout(out.plan, out.blockAssets);

        return out;
    }, [props.planId]);

    const instanceStatuses = plan.value?.plan?.spec.blocks?.reduce((agg, blockInstance) => {
        agg[blockInstance.id] = props.instanceStatus;
        return agg;
    }, {} as Record<string, InstanceStatus>);

    return (
        <DefaultContext>
            {plan.value ? (
                <PlanEditor
                    plan={plan.value.plan}
                    asset={{
                        ref: 'kapeta/something:local',
                        version: 'local',
                        exists: true,
                        content: plan.value.plan,
                        lastModified: -1,
                    }}
                    blockAssets={plan.value.blockAssets || []}
                    mode={props.plannerMode}
                    onChange={(changedPlan) => {
                        // eslint-disable-next-line no-console
                        console.log('plan changed', changedPlan);
                        applyAutoLayout(changedPlan, plan.value?.blockAssets || []);
                    }}
                    // eslint-disable-next-line no-console
                    onAssetChange={console.log}
                    instanceStates={instanceStatuses}
                />
            ) : (
                plan.error && <div>{plan.error.message}</div>
            )}
        </DefaultContext>
    );
};

const meta: Meta<typeof PlannerLoader> = {
    title: 'Highlight',
    parameters: {
        layout: 'fullscreen',
    },
    component: PlannerLoader,
    argTypes: {
        plannerMode: {
            options: ['edit', 'view', 'configure'],
            mapping: {
                edit: PlannerMode.EDIT,
                view: PlannerMode.VIEW,
                configure: PlannerMode.CONFIGURATION,
            },
            control: {
                type: 'select', // Type 'select' is automatically inferred when 'options' is defined
                labels: {
                    // 'labels' maps option values to string labels
                    edit: 'Edit',
                    view: 'View',
                    configure: 'Configure',
                },
            },
        },
        planId: {
            options: ['valid', 'invalid'],
        },
        instanceStatus: {
            options: [
                InstanceStatus.STOPPED,
                InstanceStatus.STARTING,
                InstanceStatus.READY,
                InstanceStatus.FAILED,
                InstanceStatus.UNHEALTHY,
            ],
            control: 'select',
        },
    },
};

export default meta;
type Story = StoryObj<typeof PlannerLoader>;

export const Basic: Story = {
    args: {
        plannerMode: PlannerMode.EDIT,
        instanceStatus: InstanceStatus.READY,
        planId: 'valid',
    },
};
