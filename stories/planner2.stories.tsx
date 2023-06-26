import React, { ForwardedRef, forwardRef, useContext } from 'react';
import { Meta, StoryObj } from '@storybook/react';

import { BlockLayout, ButtonStyle, DefaultContext, DialogControl } from '@kapeta/ui-web-components';

import { Planner } from '../src/planner/Planner';

import { readPlanV2 } from './data/planReader';
import {
    PlannerActionConfig,
    PlannerContext,
    PlannerContextData,
    withPlannerContext,
} from '../src/planner/PlannerContext';
import { useAsync } from 'react-use';
import { Asset, ItemType, Point, ResourceRole, IResourceTypeProvider, SchemaKind } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { ItemEditorPanel } from '../src/planner/components/ItemEditorPanel';
import { BlockNode, BlockResource, EditItemInfo, PlannerMode } from '../src';
import { DragAndDrop } from '../src/planner/utils/dndUtils';
import './styles.less';
import { BlockTypeProvider, InstanceStatus, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockServiceMock } from './data/BlockServiceMock';
import { BLOCK_SIZE } from '../src/planner/utils/planUtils';
import { BlockDefinition, BlockInstance, Resource } from '@kapeta/schemas';
import { PlannerOutlet, plannerRenderer } from '../src/planner/renderers/plannerRenderer';
import { BlockInspectorPanel } from '../src/panels/BlockInspectorPanel';

interface DraggableResourceItem {
    type: ItemType.RESOURCE;
    data: DraggableResourceProps;
}

interface DraggableBlockItem {
    type: ItemType.BLOCK;
    data: DraggableBlockProps;
}

type DraggableItem = DraggableResourceItem | DraggableBlockItem;

interface DraggableBlockProps {
    name: string;
    block: Asset<BlockDefinition>;
    planner: PlannerContextData;
}

const DraggableBlock = (props: DraggableBlockProps & { point: Point }) => {
    const center = BLOCK_SIZE / 2;
    const blockType = BlockTypeProvider.get(props.block.data!.kind);
    const Shape = blockType.shapeComponent || BlockNode;

    const instance = {
        id: 'temp-block',
        name: props.name,
        block: { ref: props.block.ref },
        dimensions: { height: 0, width: 0, top: 0, left: 0 },
    };
    return (
        <svg
            className="plan-item-dragged block"
            style={{
                left: props.point.x - center,
                top: props.point.y - center,
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                transformOrigin: `center`,
                transform: `scale(${props.planner.zoom})`,
            }}
        >
            <BlockLayout definition={props.block.data} instance={instance}>
                <Shape block={props.block.data} instance={instance} height={BLOCK_SIZE} width={BLOCK_SIZE} />
            </BlockLayout>
        </svg>
    );
};

interface DraggableResourceProps {
    name: string;
    resourceConfig: IResourceTypeProvider;
    planner: PlannerContextData;
}

const DraggableResource = (props: DraggableResourceProps & { point: Point }) => {
    const width = 120;
    const height = 40;
    return (
        <svg
            className="plan-item-dragged resource"
            style={{
                left: props.point.x - width / 2,
                top: props.point.y - height / 2,
                width,
                height,
                transformOrigin: `center`,
                transform: `scale(${props.planner.zoom})`,
            }}
        >
            <BlockResource
                role={props.resourceConfig.role}
                size={props.planner.nodeSize}
                name={props.name}
                type={props.resourceConfig.type}
                typeName={props.name}
                width={width}
                height={height}
            />
        </svg>
    );
};

const InnerPlanEditor = forwardRef<HTMLDivElement, {}>((props: any, forwardedRef: ForwardedRef<HTMLDivElement>) => {
    const planner = useContext(PlannerContext);
    const [editItem, setEditItem] = React.useState<EditItemInfo | undefined>();
    const [inspectItem, setInspectItem] = React.useState<BlockInstance | null>(null);
    const [configureItem, setConfigureItem] = React.useState<SchemaKind<any, any> | null>(null);
    const [draggableItem, setDraggableItem] = React.useState<DraggableItem | null>(null);
    const [draggableItemPosition, setDraggableItemPosition] = React.useState<Point | null>(null);
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
            },
            {
                enabled(context, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseKapetaUri(blockInstance.block.ref).version === 'local'
                    );
                },
                onClick(context, { blockInstance }) {
                    DialogControl.delete(
                        `Delete Block Instance`,
                        `Are you sure you want to delete ${blockInstance?.name || 'this block'}?`,
                        (confirm) => {
                            if (confirm) {
                                planner.removeBlockInstance(blockInstance!.id);
                            }
                        }
                    );
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
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
            },
            {
                enabled(context, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseKapetaUri(blockInstance.block.ref).version === 'local'
                    );
                },
                onClick(context, { blockInstance, resource, resourceRole }) {
                    DialogControl.delete(
                        `Delete Resource`,
                        `Are you sure you want to delete ${resource?.metadata.name || 'this resource'}?`,
                        (confirm) => {
                            if (confirm) {
                                context.removeResource(
                                    blockInstance!.block.ref,
                                    resource!.metadata.name,
                                    resourceRole!
                                );
                            }
                        }
                    );
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
        ],
        connection: [
            {
                enabled(context): boolean {
                    return planner.mode === PlannerMode.EDIT;
                },
                onClick(context, { connection }) {
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

                    DialogControl.delete(
                        `Delete Connection?`,
                        `from ${provider?.metadata.name} to ${consumer?.metadata.name}?`,
                        (confirm) => {
                            if (confirm) {
                                planner.removeConnection(connection!);
                            }
                        }
                    );
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
        ],
    };

    const blocks = useAsync(() => BlockServiceMock.list());

    return (
        <div ref={forwardedRef} className="plan-container">
            {draggableItem && draggableItemPosition && draggableItem.type === ItemType.RESOURCE && (
                <DraggableResource {...draggableItem.data} point={draggableItemPosition} />
            )}

            {draggableItem && draggableItemPosition && draggableItem.type === ItemType.BLOCK && (
                <DraggableBlock {...draggableItem.data} point={draggableItemPosition} />
            )}
            <Planner systemId="system?" actions={actionConfig} />

            <ItemEditorPanel
                open={!!editItem}
                editableItem={editItem}
                onClose={() => setEditItem(undefined)}
                onSubmit={(item) => {
                    if (editItem?.type === ItemType.BLOCK) {
                        if (editItem.creating) {
                            // TODO: Save path/ref??
                            // planner.addBlockDefinition(item);
                        } else {
                            planner.updateBlockDefinition(editItem.item.instance.block.ref, item as BlockDefinition);
                        }
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

            <div className="test-tool-panel">
                <h2>Resources</h2>
                <ul className="resources">
                    {ResourceTypeProvider.list().map((resourceConfig, ix) => {
                        const name = resourceConfig.title ?? 'Unknown';

                        return (
                            <DragAndDrop.Draggable
                                key={`resource-${ix}`}
                                disabled={false}
                                data={{
                                    type: 'resource-type',
                                    data: {
                                        title: resourceConfig.title || resourceConfig.kind,
                                        kind: resourceConfig.kind,
                                        config: resourceConfig,
                                    },
                                }}
                                onDragStart={(evt) => {
                                    setDraggableItem({
                                        type: ItemType.RESOURCE,
                                        data: {
                                            resourceConfig,
                                            name,
                                            planner,
                                        },
                                    });
                                }}
                                onDrag={(evt) => {
                                    setDraggableItemPosition({
                                        x: evt.zone.end.x,
                                        y: evt.zone.end.y,
                                    });
                                }}
                                onDrop={(evt) => {
                                    setDraggableItem(null);
                                    setDraggableItemPosition(null);
                                }}
                            >
                                {(evt) => {
                                    return (
                                        <li {...evt.componentProps}>
                                            <span className="title">{name}</span>
                                            <span className="role">{resourceConfig.role.toLowerCase()}</span>
                                        </li>
                                    );
                                }}
                            </DragAndDrop.Draggable>
                        );
                    })}
                </ul>

                <h2>Blocks</h2>
                <ul className="blocks">
                    {blocks?.value?.map((block, ix) => {
                        const name = block.data.metadata.name;
                        return (
                            <DragAndDrop.Draggable
                                key={`block_${ix}`}
                                disabled={false}
                                data={{
                                    type: 'block-type',
                                    data: block,
                                }}
                                onDragStart={(evt) => {
                                    setDraggableItem({
                                        type: ItemType.BLOCK,
                                        data: {
                                            block,
                                            name,
                                            planner,
                                        },
                                    });
                                }}
                                onDrag={(evt) => {
                                    setDraggableItemPosition({
                                        x: evt.zone.end.x,
                                        y: evt.zone.end.y,
                                    });
                                }}
                                onDrop={(evt) => {
                                    setDraggableItem(null);
                                    setDraggableItemPosition(null);
                                }}
                            >
                                {(evt) => {
                                    return (
                                        <li {...evt.componentProps}>
                                            <span className="title">{name}</span>
                                            <span className="version">{block.version}</span>
                                        </li>
                                    );
                                }}
                            </DragAndDrop.Draggable>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
});

const PlanEditor = withPlannerContext(InnerPlanEditor);

const PlannerLoader = (props) => {
    const plan = useAsync(() => readPlanV2());

    const instanceStatuses = plan.value?.plan?.spec.blocks?.reduce((agg, blockInstance) => {
        agg[blockInstance.id] = props.instanceStatus;
        return agg;
    }, {} as Record<string, InstanceStatus>);

    return (
        <DefaultContext>
            {plan.value ? (
                <PlanEditor
                    plan={plan.value.plan}
                    blockAssets={plan.value.blockAssets || []}
                    mode={props.plannerMode}
                    // eslint-disable-next-line no-console
                    onChange={console.log}
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
    title: 'Planner',
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
        instanceStatus: {
            options: [
                InstanceStatus.STOPPED,
                InstanceStatus.STARTING,
                InstanceStatus.READY,
                InstanceStatus.EXITED,
                InstanceStatus.UNHEALTHY,
            ],
            control: 'select',
        },
    },
};

export default meta;
type Story = StoryObj<typeof PlannerLoader>;

export const ViewOnly: Story = {
    args: {
        plannerMode: PlannerMode.VIEW,
        instanceStatus: InstanceStatus.READY,
    },
};
export const EditMode: Story = {
    args: {
        plannerMode: PlannerMode.EDIT,
        instanceStatus: InstanceStatus.READY,
    },
};
export const ConfigureMode: Story = {
    args: {
        plannerMode: PlannerMode.CONFIGURATION,
        instanceStatus: InstanceStatus.READY,
    },
};

export const CustomRenderer = () => {
    const outlets: Parameters<typeof plannerRenderer.Provider>[0]['outlets'] = {
        [PlannerOutlet.ResourceSubTitle]: (props) => {
            return <button>Select operator</button>;
        },
    };
    return (
        <plannerRenderer.Provider outlets={outlets}>
            <PlannerLoader plannerMode={PlannerMode.EDIT} instanceStatus={InstanceStatus.STARTING} />
        </plannerRenderer.Provider>
    );
};
