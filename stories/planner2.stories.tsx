import React, { useContext } from 'react';

import { ButtonStyle, DefaultContext, Loader } from '@kapeta/ui-web-components';

import { Planner } from '../src/planner2/Planner2';

import { readPlanV2 } from './data/planReader';
import {
    PlannerActionConfig,
    PlannerContext,
    PlannerMode,
    withPlannerContext,
} from '../src/planner2/PlannerContext';
import { useAsync } from 'react-use';
import { ItemType, SchemaKind } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { ItemEditorPanel } from '../src/planner2/components/ItemEditorPanel';
import { EditableItemInterface2 } from '../src/planner2/types';

export default {
    title: 'Planner2',
    parameters: {
        layout: 'fullscreen',
    },
};

export const PlannerEditor2 = () => {
    return (
        <DefaultContext>
            <Loader
                load={() =>
                    readPlanV2().then(({ plan, blockAssets }) => (
                        <Planner
                            systemId="my-system"
                            plan={plan}
                            blockAssets={blockAssets}
                            mode={PlannerMode.EDIT}
                        />
                    ))
                }
            />
        </DefaultContext>
    );
};

export const PlannerViewer2 = () => {
    return (
        <DefaultContext>
            <Loader
                load={() =>
                    readPlanV2().then(({ plan, blockAssets }) => {
                        return (
                            <Planner
                                systemId="my-system"
                                plan={plan}
                                blockAssets={blockAssets}
                                mode={PlannerMode.VIEW}
                            />
                        );
                    })
                }
            />
        </DefaultContext>
    );
};

export const PlannerConfig2 = () => {
    return (
        <DefaultContext>
            <Loader
                load={() =>
                    readPlanV2().then(({ plan, blockAssets }) => {
                        return (
                            <Planner
                                systemId="my-system"
                                plan={plan}
                                blockAssets={blockAssets}
                                mode={PlannerMode.CONFIGURATION}
                            />
                        );
                    })
                }
            />
        </DefaultContext>
    );
};

const PlanEditor = withPlannerContext(() => {
    const planner = useContext(PlannerContext);
    const [editItem, setEditItem] = React.useState<
        EditableItemInterface2 | undefined
    >();
    const [inspectItem, setInspectItem] = React.useState<SchemaKind<
        any,
        any
    > | null>(null);
    const [configureItem, setConfigureItem] = React.useState<SchemaKind<
        any,
        any
    > | null>(null);

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
                        parseKapetaUri(blockInstance.block.ref).version ===
                            'local'
                    );
                },
                onClick(context, { blockInstance }) {
                    planner.removeBlockInstance(blockInstance!.id);
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
                        parseKapetaUri(blockInstance.block.ref).version ===
                            'local'
                    );
                },
                onClick(context, { block }) {
                    setEditItem({
                        type: ItemType.BLOCK,
                        item: block!,
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
                        parseKapetaUri(blockInstance.block.ref).version ===
                            'local'
                    );
                },
                onClick(p, { resource }) {
                    setEditItem(resource!);
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
                        parseKapetaUri(blockInstance.block.ref).version ===
                            'local'
                    );
                },
                onClick(context, { block, resource, resourceRole }) {
                    // Block id?
                    context.removeResource(
                        block!,
                        resource!.metadata.name,
                        resourceRole!
                    );
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
        ],

        // TODO: Need to figure out props to both render and enabled
        connection: [
            {
                enabled(context): boolean {
                    return planner.mode !== PlannerMode.VIEW;
                },
                onClick(context, { connection }) {
                    planner.removeConnection(connection!);
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
        ],
    };

    return (
        <>
            <Planner systemId="system?" actions={actionConfig} />
            <ItemEditorPanel
                open={!!editItem}
                editableItem={editItem}
                onClose={() => setEditItem(undefined)}
            />
        </>
    );
});

export const PlannerActions = () => {
    const plan = useAsync(() => readPlanV2());
    return (
        <DefaultContext>
            {plan.value ? (
                <PlanEditor
                    plan={plan.value.plan}
                    blockAssets={plan.value.blockAssets || []}
                    mode={PlannerMode.EDIT}
                />
            ) : (
                plan.error && <div>{plan.error.message}</div>
            )}
        </DefaultContext>
    );
};
