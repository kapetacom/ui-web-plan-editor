/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { ForwardedRef, forwardRef, useContext } from 'react';
import { Meta, StoryObj } from '@storybook/react';

import { ButtonStyle, DefaultContext } from '@kapeta/ui-web-components';

import { Planner } from '../src/planner/Planner';

import { readInvalidPlan, readPlanV2 } from './data/planReader';
import { PlannerActionConfig, PlannerContext, withPlannerContext } from '../src/planner/PlannerContext';
import { useAsync } from 'react-use';
import { ItemType, ResourceRole, SchemaKind } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { ItemEditorPanel } from './helpers/ItemEditorPanel';
import { EditItemInfo, PlannerMode, PlannerSidebar } from '../src';
import { InstanceStatus } from '@kapeta/ui-web-context';

import { BlockDefinition, BlockInstance, Resource } from '@kapeta/schemas';
import { PlannerOutlet, plannerRenderer } from '../src/planner/renderers/plannerRenderer';
import { BlockInspectorPanel } from '../src/panels/BlockInspectorPanel';
import { PlannerResourcesList } from '../src/panels/tools/PlannerResourcesList';

import { useConfirmDelete } from '@kapeta/ui-web-components';
import { PlannerDrawer } from '../src/panels/PlannerDrawer';
import { Box, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { PublicUrlList } from '../src/panels/tools/PublicUrlList';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import './styles.less';

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
        ],
    };

    const [currentTab, setCurrentTab] = React.useState(planner.mode === PlannerMode.EDIT ? 'resources' : 'urls');

    return (
        <div ref={forwardedRef} className="plan-container">
            <PlannerDrawer>
                <Tabs value={currentTab} onChange={(_evt, value) => setCurrentTab(value)}>
                    {planner.mode === PlannerMode.EDIT && <Tab value="resources" label="Resources" />}
                    <Tab value="urls" label="Public URLs" />
                </Tabs>
                {currentTab === 'resources' && <PlannerResourcesList onShowMoreAssets={() => {}} />}
                {currentTab === 'urls' && (
                    <PublicUrlList
                        onConfigureGateway={() => {
                            console.log('configured!');
                        }}
                    />
                )}
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
                    autoFit: false,
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
    const plan = useAsync(() => (props.planId === 'invalid' ? readInvalidPlan() : readPlanV2()), [props.planId]);

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

export const ViewOnly: Story = {
    args: {
        plannerMode: PlannerMode.VIEW,
        instanceStatus: InstanceStatus.READY,
        planId: 'valid',
    },
};

export const ViewOnlyError: Story = {
    args: {
        plannerMode: PlannerMode.VIEW,
        instanceStatus: InstanceStatus.READY,
        planId: 'invalid',
    },
};

export const EditMode: Story = {
    args: {
        plannerMode: PlannerMode.EDIT,
        instanceStatus: InstanceStatus.READY,
        planId: 'valid',
    },
};

export const EditModeError: Story = {
    args: {
        plannerMode: PlannerMode.EDIT,
        instanceStatus: InstanceStatus.READY,
        planId: 'invalid',
    },
};

export const ConfigureMode: Story = {
    args: {
        plannerMode: PlannerMode.CONFIGURATION,
        instanceStatus: InstanceStatus.READY,
        planId: 'valid',
    },
};

export const ConfigureModeError: Story = {
    args: {
        plannerMode: PlannerMode.CONFIGURATION,
        instanceStatus: InstanceStatus.READY,
        planId: 'invalid',
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

export const PlannerSidebarWithStringTitle = () => {
    const [open, setOpen] = React.useState(true);
    return (
        <PlannerSidebar open={open} title="Sidebar title" onClose={() => setOpen(false)}>
            Sidebar content
        </PlannerSidebar>
    );
};

export const PlannerSidebarWithCustomTitle = () => {
    const [open, setOpen] = React.useState(true);
    return (
        <PlannerSidebar
            open={open}
            title={
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography variant="h6">Sidebar title</Typography>
                    <IconButton size="medium">
                        <SettingsOutlinedIcon fontSize="inherit" />
                    </IconButton>
                </Box>
            }
            onClose={() => setOpen(false)}
        >
            Sidebar content
        </PlannerSidebar>
    );
};
