import React from 'react';

import { ButtonStyle, DefaultContext, Loader } from '@kapeta/ui-web-components';

import { Planner } from '../src/planner2/Planner2';

import { readPlanV2 } from './data/planReader';
import {
    PlannerActionConfig,
    PlannerMode,
} from '../src/planner2/PlannerContext';
import { useAsync } from 'react-use';

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
    const [isOpen, setIsOpen] = React.useState(false);

    const actionConfig: PlannerActionConfig = {
        block: [
            {
                enabled(planner): boolean {
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
                enabled(planner): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick() {
                    alert('delete');
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
            {
                enabled(planner): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick() {
                    alert('edit');
                },
                buttonStyle: ButtonStyle.SECONDARY,
                icon: 'fa fa-pencil',
                label: 'Edit',
            },
            {
                enabled(planner): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick() {
                    alert('configure');
                },
                buttonStyle: ButtonStyle.DEFAULT,
                icon: 'fa fa-tools',
                label: 'Configure',
            },
        ],
        // TODO: Need resource id 🤔
        resource: [
            {
                enabled(planner): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick() {
                    alert('edit');
                },
                buttonStyle: ButtonStyle.SECONDARY,
                icon: 'fa fa-pencil',
                label: 'Edit',
            },
            {
                enabled(planner): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick() {
                    alert('edit');
                },
                buttonStyle: ButtonStyle.SECONDARY,
                icon: 'fa fa-pencil',
                label: 'Edit',
            },
            {
                enabled(planner): boolean {
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick() {
                    alert('delete');
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
                    return true; // planner.mode !== PlannerMode.VIEW;
                },
                onClick() {
                    alert('delete connection');
                },
                buttonStyle: ButtonStyle.DANGER,
                icon: 'fa fa-trash',
                label: 'Delete',
            },
        ],
    };

    return (
        <DefaultContext>
            {isOpen ? <h1 onClick={() => setIsOpen(false)}>AWESOME</h1> : null}

            {plan.value ? (
                <Planner
                    plan={plan.value.plan}
                    blockAssets={plan.value.blockAssets || []}
                    systemId="some-system"
                    actions={actionConfig}
                />
            ) : null}
        </DefaultContext>
    );
};
