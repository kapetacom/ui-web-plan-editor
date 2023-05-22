import { BlockService, BlockTargetProvider, BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { ResourceRole, ResourceProviderType } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { cloneDeep } from 'lodash';
import React from 'react';

import { blockRenderer, BlockOutlet } from '../../src/planner2/renderers/blockRenderer';

export const BlockServiceMock = BlockService;

const blocks = [
    require('./blocks/kapeta-user.json'),
    require('./blocks/kapeta-todo.json'),
    require('./blocks/kapeta-images.json'),
].map((data) => {
    return {
        ref: `${data.metadata.name}:1.2.3`,
        path: '.',
        kind: data.kind,
        data: cloneDeep(data),
        exists: true,
        ymlPath: '.',
        version: '1.2.3',
        editable: true,
    };
});

blocks.push(
    ...[
        require('./blocks/kapeta-user.json'),
        require('./blocks/kapeta-todo.json'),
        require('./blocks/kapeta-images.json'),
    ].map((data) => {
        return {
            ref: `${data.metadata.name}:1.0.2`,
            path: '.',
            kind: data.kind,
            data: cloneDeep(data),
            exists: true,
            ymlPath: '.',
            version: '1.0.2',
            editable: true,
        };
    })
);

blocks.push(
    ...[
        require('./blocks/kapeta-user.json'),
        require('./blocks/kapeta-todo.json'),
        require('./blocks/kapeta-todo-frontend.json'),
        require('./blocks/kapeta-todo-mobile.json'),
        require('./blocks/kapeta-images.json'),
    ].map((data) => {
        return {
            ref: `${data.metadata.name}:local`,
            path: '.',
            kind: data.kind,
            data: cloneDeep(data),
            exists: true,
            ymlPath: '.',
            version: 'local',
            editable: true,
        };
    })
);

[
    require('./blocks/kapeta-resource-type-mongodb.json'),
    require('./blocks/kapeta-resource-type-postgresql.json'),
].forEach((resource) => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceProviderType.OPERATOR,
        role: ResourceRole.CONSUMES,
        definition: resource,
    });
});

[require('./blocks/kapeta-resource-type-rest-client.json')].forEach((resource) => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceProviderType.INTERNAL,
        role: ResourceRole.CONSUMES,
        converters: [{ fromKind: 'kapeta/resource-type-rest-api' }],
        getCounterValue() {
            return 2;
        },
        definition: resource,
    });
});

[require('./blocks/kapeta-resource-type-rest-api.json')].forEach((resource) => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceProviderType.INTERNAL,
        role: ResourceRole.PROVIDES,
        consumableKind: 'kapeta/resource-type-rest-client',
        validate: (data) => {
            const errors: string[] = [];
            parseKapetaUri(data.kind);

            if (!data.spec.methods) {
                errors.push('No methods defined!');
            }

            if (data.spec.throw) {
                throw Error('Thrown from type provider!');
            }

            return errors;
        },
        getCounterValue: (data) => {
            return 3;
        },
        definition: resource,
    });
});

['kapeta/language-target-java-spring-boot', 'kapeta/language-target-test'].forEach((targetKind) => {
    BlockTargetProvider.register({
        kind: targetKind,
        version: '1.2.3',
        title: 'Test',
        blockKinds: ['kapeta/block-type-service'],
        definition: {
            kind: 'kapeta/language-target',
            metadata: {
                name: targetKind,
            },
        },
    });
});

['kapeta/language-target-fails'].forEach((targetKind) => {
    BlockTargetProvider.register({
        kind: targetKind,
        version: '1.2.3',
        title: 'Test',
        blockKinds: ['kapeta/block-type-service'],
        validate: () => {
            return ['Fail target always fails'];
        },
        definition: {
            kind: 'kapeta/language-target',
            metadata: {
                name: targetKind,
            },
        },
    });
});

const serviceBlock = require('./blocks/kapeta-block-type-service.json');

BlockTypeProvider.register({
    kind: serviceBlock.metadata.name,
    version: '1.2.3',
    editorComponent: null as any,
    validate: (block) => {
        const errors: string[] = [];
        if (!block?.spec?.target?.kind) {
            errors.push('Missing target kind');
        } else {
            parseKapetaUri(block?.spec?.target?.kind);
            BlockTargetProvider.get(block?.spec?.target?.kind, block.kind);
        }

        return errors;
    },
    // shapeComponent: ({ block, instance, readOnly }) => {
    //     return <circle r={40} cx={40} cy={40} />;
    // },
    definition: serviceBlock,
});

const frontendBlock = require('./blocks/kapeta-block-type-frontend.json');
BlockTypeProvider.register({
    kind: frontendBlock.metadata.name,
    version: '1.2.3',
    editorComponent: null as any,
    validate: (block) => {
        const errors: string[] = [];
        if (!block?.spec?.target?.kind) {
            errors.push('Missing target kind');
        } else {
            parseKapetaUri(block?.spec?.target?.kind);
            BlockTargetProvider.get(block?.spec?.target?.kind, block.kind);
        }

        return errors;
    },
    shapeComponent: ({ height, width, ...context }) => {
        // Scaling the topbar svg to fit the block
        const svgWidth = 192;
        const svgHeight = 170 * (width / svgWidth);

        return (
            <g className="block-node" style={{ cursor: context.readOnly ? 'default' : 'move' }}>
                {/* Background */}
                <rect width={width} height={height} rx="6" fill="white" />
                {/* Border */}
                <rect
                    x="0.5"
                    y="0.5"
                    width={width - 1}
                    height={height - 1}
                    rx="5.5"
                    fill="none"
                    stroke="black"
                    strokeOpacity="0.12"
                />
                {/* Topbar */}
                <svg width={width} height={svgHeight} viewBox="0 0 192 170" fill="none">
                    <path
                        d="M1 6C1 3.23858 3.23858 1 6 1H186C188.761 1 191 3.23858 191 6V24H1V6Z"
                        fill="black"
                        fillOpacity="0.12"
                    />
                    <path
                        opacity="0.9"
                        d="M34 12C34 10.8954 34.8954 10 36 10H166C167.105 10 168 10.8954 168 12C168 13.1046 167.105 14 166 14H36C34.8954 14 34 13.1046 34 12Z"
                        fill="white"
                    />
                    <path
                        opacity="0.9"
                        d="M8 12C8 10.8954 8.89543 10 10 10C11.1046 10 12 10.8954 12 12C12 13.1046 11.1046 14 10 14C8.89543 14 8 13.1046 8 12Z"
                        fill="white"
                    />
                    <path
                        opacity="0.9"
                        d="M15 12C15 10.8954 15.8954 10 17 10C18.1046 10 19 10.8954 19 12C19 13.1046 18.1046 14 17 14C15.8954 14 15 13.1046 15 12Z"
                        fill="white"
                    />
                    <path
                        opacity="0.9"
                        d="M22 12C22 10.8954 22.8954 10 24 10C25.1046 10 26 10.8954 26 12C26 13.1046 25.1046 14 24 14C22.8954 14 22 13.1046 22 12Z"
                        fill="white"
                    />
                </svg>

                <svg fill="none" x={130} y={-30}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockStatus} context={context} />
                </svg>
                {/* Offset if block has error */}
                <svg fill="none" x={width / 2} y={40} width={width - 20} viewBox={`0 0 ${width} 150`}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockInstanceName} context={context} />
                </svg>
                <svg fill="none" x={width / 2} y={90}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockName} context={context} />
                </svg>

                <svg y={105} x={width / 2}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockHandle} context={context} />
                </svg>

                <svg y={height - 20} x={width / 2}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockVersion} context={context} />
                </svg>
            </g>
        );
    },
    definition: frontendBlock,
});

const mobileBlock = require('./blocks/kapeta-block-type-mobile.json');
BlockTypeProvider.register({
    kind: mobileBlock.metadata.name,
    version: '1.2.3',
    editorComponent: null as any,
    validate: (block) => {
        const errors: string[] = [];
        if (!block?.spec?.target?.kind) {
            errors.push('Missing target kind');
        } else {
            parseKapetaUri(block?.spec?.target?.kind);
            BlockTargetProvider.get(block?.spec?.target?.kind, block.kind);
        }

        return errors;
    },
    shapeComponent: ({ width, height, ...context }) => {
        // Make the mobile block a bit smaller
        const svgWidth = 152;
        const svgHeight = 104 * (width / svgWidth);
        return (
            <g className="block-node" style={{ cursor: context.readOnly ? 'default' : 'move' }}>
                {/* Background */}
                <rect x={0} y={0} width={width} fill="white" height={height} rx="5px" ry="5px" />
                {/* Border */}
                <rect
                    x="0.5"
                    y="0.5"
                    width={width - 1}
                    height={height - 1}
                    rx="5.5"
                    fill="none"
                    stroke="black"
                    strokeOpacity="0.12"
                />
                {/* Notch and pill */}
                <svg
                    width={width}
                    height={svgHeight}
                    viewBox="0 0 152 104"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M30 1H122L115.867 17.1321C114.982 19.4607 112.75 21 110.259 21H41.7413C39.2501 21 37.0181 19.4607 36.1329 17.1321L30 1Z"
                        fill="black"
                        fillOpacity="0.12"
                    />
                    <path
                        opacity="0.9"
                        d="M66 11C66 9.89543 66.8954 9 68 9H84C85.1046 9 86 9.89543 86 11V11C86 12.1046 85.1046 13 84 13H68C66.8954 13 66 12.1046 66 11V11Z"
                        fill="white"
                    />
                </svg>
                <svg fill="none" x={130} y={-28}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockStatus} context={context} />
                </svg>
                {/* TODO: add y-offset if block has error */}
                <svg fill="none" x={width / 2} y={40} width={width - 20} viewBox={`0 0 ${width} 150`}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockInstanceName} context={context} />
                </svg>
                {/* Name + handle */}
                <svg fill="none" x={width / 2} y={90}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockName} context={context} />
                </svg>
                <svg y={105} x={width / 2}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockHandle} context={context} />
                </svg>
                <svg y={height - 20} x={width / 2}>
                    <blockRenderer.Outlet id={BlockOutlet.BlockVersion} context={context} />
                </svg>
            </g>
        );
    },
    definition: mobileBlock,
});

// Mock getter
BlockServiceMock.list = async () => {
    return [...blocks];
};

// @ts-ignore
BlockServiceMock.get = async (ref) => {
    const uri = parseKapetaUri(ref);
    const out = blocks.find((a) => {
        const aUri = parseKapetaUri(a.ref);
        return uri.fullName === aUri.fullName;
    });
    if (!out) {
        // eslint-disable-next-line no-console
        console.error('Could not find ref: ', ref);
    }
    return out;
};
