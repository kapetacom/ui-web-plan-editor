import React from 'react';

import { ButtonStyle, DefaultContext, Loader } from '@kapeta/ui-web-components';

import { Planner } from '../src/planner2/Planner2';

import { readPlanV2 } from './data/planReader';
import {
    PlannerActionConfig,
    PlannerMode,
} from '../src/planner2/PlannerContext';
import { useAsync } from 'react-use';
import { ItemEditorPanel } from '../src/planner2/components/ItemEditorPanel';
import { SchemaKind } from '@kapeta/ui-web-types';
import { parseBlockwareUri } from '@kapeta/nodejs-utils';

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

export const PlannerActions = () => {
    const plan = useAsync(() => readPlanV2());
    //

    const [editItem, setEditItem] = React.useState<SchemaKind<any, any> | null>(
        null
    );
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
                onClick() {
                    alert('inspect');
                },
                buttonStyle: ButtonStyle.PRIMARY,
                icon: 'fa fa-search',
                label: 'Inspect',
            },
            {
                enabled(planner, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseBlockwareUri(blockInstance.block.ref).version ===
                            'local'
                    );
                },
                onClick() {
                    alert('delete');
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
            {
                enabled(planner, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseBlockwareUri(blockInstance.block.ref).version ===
                            'local'
                    );
                },
                onClick() {
                    alert('edit');
                },
                buttonStyle: ButtonStyle.SECONDARY,
                icon: 'fa fa-pencil',
                label: 'Edit',
            },
            {
                enabled(planner, { blockInstance }): boolean {
                    return planner.mode === PlannerMode.CONFIGURATION;
                },
                onClick(planner, { block }) {
                    setConfigureItem(block);
                },
                buttonStyle: ButtonStyle.DEFAULT,
                icon: 'fa fa-tools',
                label: 'Configure',
            },
        ],
        resource: [
            {
                enabled(planner, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseBlockwareUri(blockInstance.block.ref).version ===
                            'local'
                    );
                },
                onClick(item, { resource }) {
                    setEditItem({ type: 'resource' });
                },
                buttonStyle: ButtonStyle.SECONDARY,
                icon: 'fa fa-pencil',
                label: 'Edit',
            },
            {
                enabled(planner, { blockInstance }): boolean {
                    return (
                        planner.mode !== PlannerMode.VIEW &&
                        !!blockInstance &&
                        parseBlockwareUri(blockInstance.block.ref).version ===
                            'local'
                    );
                },
                onClick(planner, { block }) {
                    setEditItem(block);
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
        ],

        // TODO: Need to figure out props to both render and enabled
        connection: [
            {
                enabled(planner): boolean {
                    return planner.mode !== PlannerMode.VIEW;
                },
                onClick(planner, { connection }) {
                    alert(
                        `delete connection from ${connection.from.blockId} to ${connection.to.blockId}`
                    );
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
        ],
    };

    return (
        <DefaultContext>
            {plan.value ? (
                <Planner
                    plan={plan.value.plan}
                    blockAssets={plan.value.blockAssets || []}
                    systemId="some-system"
                    actions={actionConfig}
                    mode={PlannerMode.EDIT}
                />
            ) : null}

            <ItemEditorPanel open={!!editItem} editableItem={editItem} />
        </DefaultContext>
    );
};
