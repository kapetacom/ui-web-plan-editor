import React, { useContext } from 'react';
import { Meta, StoryObj } from '@storybook/react';

import { ButtonStyle, DefaultContext, DialogControl } from '@kapeta/ui-web-components';

import { Planner2 } from '../src/planner2/Planner2';

import { readPlanV2 } from './data/planReader';
import { PlannerActionConfig, PlannerContext, withPlannerContext } from '../src/planner2/PlannerContext';
import { useAsync } from 'react-use';
import { BlockKind, ItemType, ResourceRole, SchemaKind } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { ItemEditorPanel } from '../src/planner2/components/ItemEditorPanel';
import { EditableItemInterface2 } from '../src/planner2/types';
import { PlannerMode } from '../src';

const PlanEditor = withPlannerContext(() => {
    const planner = useContext(PlannerContext);
    const [editItem, setEditItem] = React.useState<EditableItemInterface2 | undefined>();
    const [inspectItem, setInspectItem] = React.useState<SchemaKind<any, any> | null>(null);
    const [configureItem, setConfigureItem] = React.useState<SchemaKind<any, any> | null>(null);

    const actionConfig: PlannerActionConfig = {
        block: [
            {
                enabled(): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick(context, { block }) {
                    setInspectItem(block!);
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
                        item: block!,
                        ref: blockInstance!.block.ref,
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
                onClick(p, { resource }) {
                    setEditItem({
                        type: ItemType.RESOURCE,
                        item: resource!,
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
                    return planner.mode !== PlannerMode.VIEW;
                },
                onClick(context, { connection }) {
                    const from = planner.getResourceByBlockIdAndName(
                        connection!.from.blockId,
                        connection!.from.resourceName,
                        ResourceRole.PROVIDES
                    );
                    const to = planner.getResourceByBlockIdAndName(
                        connection!.to.blockId,
                        connection!.to.resourceName,
                        ResourceRole.CONSUMES
                    );

                    DialogControl.delete(
                        `Delete Connection?`,
                        `from ${from?.metadata.name} to ${to?.metadata.name}?`,
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

    return (
        <>
            <Planner2 systemId="system?" actions={actionConfig} />
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
                            planner.updateBlockDefinition(editItem.ref!, item as BlockKind);
                        }
                    }

                    if (editItem?.type === ItemType.RESOURCE) {
                        if (editItem.creating) {
                            //     ???
                        } else {
                            // update mapping?
                            // planner.updateResourceDefinition(); //
                        }
                    }
                }}
            />
        </>
    );
});

const PlannerLoader = (props) => {
    const plan = useAsync(() => readPlanV2());

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
                />
            ) : (
                plan.error && <div>{plan.error.message}</div>
            )}
        </DefaultContext>
    );
};

const meta: Meta<typeof PlannerLoader> = {
    title: 'Planner2',
    parameters: {
        layout: 'fullscreen',
    },
    component: PlannerLoader,
    argTypes: {
        plannerMode: {
            options: [PlannerMode.EDIT, PlannerMode.VIEW, PlannerMode.CONFIGURATION],
            control: { type: 'radio' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof PlannerLoader>;

export const ViewOnly: Story = {
    args: {
        plannerMode: PlannerMode.VIEW,
    },
};
export const EditMode: Story = {
    args: {
        plannerMode: PlannerMode.EDIT,
    },
};
export const ConfigureMode: Story = {
    args: {
        plannerMode: PlannerMode.CONFIGURATION,
    },
};
