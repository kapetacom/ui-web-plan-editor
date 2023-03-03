import React from 'react';

import { DefaultContext, Loader } from '@blockware/ui-web-components';
import { InstanceStatus } from '@blockware/ui-web-context';
import { ResourceRole } from '@blockware/ui-web-types';

import {
    Planner,
    PlannerBlockNode,
    PlannerBlockResourceList,
    PlannerBlockResourceListItem,
    PlannerMode,
    PlannerNodeSize,
    ResourceMode,
} from '../src';

import { readPlan } from './data/planReader';

export default {
    title: 'Planner',
    parameters: {
        layout: 'fullscreen',
    },
};

export const StandAloneBlocks = () => {
    return (
        <Loader
            load={() =>
                readPlan().then((plan) => (
                    <div
                        className="planner-canvas"
                        style={{ width: '800px', height: '800px' }}
                    >
                        <PlannerBlockNode
                            size={PlannerNodeSize.FULL}
                            zoom={1}
                            status={InstanceStatus.UNHEALTHY}
                            block={plan.blocks[0]}
                        />
                        <PlannerBlockNode
                            size={PlannerNodeSize.FULL}
                            zoom={1}
                            status={InstanceStatus.READY}
                            block={plan.blocks[3]}
                        />
                    </div>
                ))
            }
        />
    );
};

export const PlannerEditor = () => {
    return (
        <DefaultContext>
            <Loader
                load={() =>
                    readPlan().then((plan) => (
                        <Planner systemId="my-system" plan={plan} />
                    ))
                }
            />
        </DefaultContext>
    );
};

export const PlannerViewer = () => {
    return (
        <DefaultContext>
            <Loader
                load={() =>
                    readPlan().then((plan) => {
                        plan.setMode(PlannerMode.VIEW);
                        return <Planner systemId="my-system" plan={plan} />;
                    })
                }
            />
        </DefaultContext>
    );
};

export const PlannerConfig = () => {
    return (
        <DefaultContext>
            <Loader
                load={() =>
                    readPlan().then((plan) => {
                        plan.setMode(PlannerMode.CONFIGURATION);
                        return <Planner systemId="my-system" plan={plan} />;
                    })
                }
            />
        </DefaultContext>
    );
};

export const BlockResourceProvider = () => {
    return (
        <Loader
            load={() =>
                readPlan().then((plan) => {
                    const block = plan.blocks[0];
                    const resource = block.provides[0];
                    resource.setMode(ResourceMode.SHOW_OPTIONS);

                    return (
                        <svg
                            width="800"
                            height="1400"
                            className="planner-canvas"
                        >
                            <PlannerBlockResourceListItem
                                index={1}
                                resource={resource}
                            />
                        </svg>
                    );
                })
            }
        />
    );
};

export const BlockResourceConsumer = () => {
    return (
        <Loader
            load={() =>
                readPlan().then((plan) => {
                    const block = plan.blocks[0];
                    const resource = block.consumes[0];
                    resource.setMode(ResourceMode.SHOW_OPTIONS);

                    return (
                        <svg
                            width="800"
                            height="1400"
                            className="planner-canvas"
                        >
                            <svg x={200} y={0} width={400} height={600}>
                                <PlannerBlockResourceListItem
                                    resource={resource}
                                    index={1}
                                />
                            </svg>
                        </svg>
                    );
                })
            }
        />
    );
};

export const BlockResourceConsumerList = () => {
    return (
        <Loader
            load={() =>
                readPlan().then((plan) => (
                    <svg width="800" height="1400" className="planner-canvas">
                        <svg x={200} y={0} width={400} height={600}>
                            <PlannerBlockResourceList
                                list={plan.blocks[2].consumes}
                                role={ResourceRole.CONSUMES}
                                size={PlannerNodeSize.FULL}
                                blockData={plan.blocks[2]}
                            />
                        </svg>
                    </svg>
                ))
            }
        />
    );
};

export const BlockResourceProviderList = () => {
    return (
        <Loader
            load={() =>
                readPlan().then((plan) => (
                    <svg width="800" height="1400" className="planner-canvas">
                        <PlannerBlockResourceList
                            list={plan.blocks[1].provides}
                            size={PlannerNodeSize.FULL}
                            role={ResourceRole.PROVIDES}
                            blockData={plan.blocks[1]}
                        />
                    </svg>
                ))
            }
        />
    );
};
