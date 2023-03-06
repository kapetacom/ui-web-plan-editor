import React from 'react';

import { DefaultContext, Loader } from '@blockware/ui-web-components';

import { Planner } from '../src/planner2/Planner2';

import { readPlanV2 } from './data/planReader';
import { PlannerMode } from '../src/planner2/PlannerContext';

export default {
    title: 'Planner',
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
