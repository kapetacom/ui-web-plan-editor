/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { BlockStore, BlockTargetProvider, BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { ResourceRole, ResourceProviderType, Asset } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { cloneDeep } from 'lodash';
import React from 'react';

import {
    BlockHandle,
    BlockInstanceName,
    BlockName,
    BlockStatus,
    BlockVersion,
    FormField,
    useBlock,
} from '@kapeta/ui-web-components';
import { BlockDefinition } from '@kapeta/schemas';

const EditorComponent = () => {
    return (
        <div className="resource-editor">
            <FormField name="metadata.name" label="Name" validation={['required']} help="Name the resource" />
        </div>
    );
};

const blocks = [
    require('./blocks/kapeta-user.json'),
    require('./blocks/kapeta-todo.json'),
    require('./blocks/kapeta-images.json'),
    require('./blocks/kapeta-todo-invalid-kind.json'),
    require('./blocks/kapeta-user-invalid-resource.json'),
    require('./blocks/kapeta-user-invalid-target.json'),
    require('./blocks/kapeta-todo-missing-kind.json'),
    require('./blocks/kapeta-user-missing-resource.json'),
    require('./blocks/kapeta-user-missing-target.json'),
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
        require('./blocks/kapeta-gateway.json'),
        require('./blocks/kapeta-todo-invalid-kind.json'),
        require('./blocks/kapeta-user-invalid-resource.json'),
        require('./blocks/kapeta-user-invalid-target.json'),
        require('./blocks/kapeta-todo-missing-kind.json'),
        require('./blocks/kapeta-user-missing-resource.json'),
        require('./blocks/kapeta-user-missing-target.json'),
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
        editorComponent: EditorComponent,
    });
});

[require('./blocks/kapeta-resource-type-rest-client.json')].forEach((resource) => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceProviderType.INTERNAL,
        role: ResourceRole.CONSUMES,
        converters: [
            {
                fromKind: 'kapeta/resource-type-rest-api',
                validateMapping(connection, from, to) {
                    return connection?.throw ? ['Invalid mapping!'] : [];
                },
            },
        ],
        getCounterValue() {
            return 2;
        },
        definition: resource,
        editorComponent: EditorComponent,
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
        editorComponent: EditorComponent,
        capabilities: {
            directDSL: true,
        },
    });
});

[require('./blocks/kapeta-resource-type-web-page.json')].forEach((resource) => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceProviderType.INTERNAL,
        role: ResourceRole.PROVIDES,
        consumableKind: 'kapeta/resource-type-web-fragment',
        definition: resource,
        converters: [{ fromKind: 'kapeta/resource-type-web-fragment' }],
    });
});

[require('./blocks/kapeta-resource-type-web-fragment.json')].forEach((resource) => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceProviderType.INTERNAL,
        role: ResourceRole.CONSUMES,
        definition: resource,
        converters: [{ fromKind: 'kapeta/resource-type-web-page' }],
        capabilities: {
            allowMultipleConnections: true,
        },
    });
});

['kapeta/language-target-java-spring-boot', 'kapeta/language-target-test'].forEach((targetKind) => {
    BlockTargetProvider.register({
        kind: targetKind,
        version: '1.2.3',
        title: 'kapeta/language-target-java-spring-boot' === targetKind ? 'Java Spring Boot' : 'Test',
        blockKinds: ['kapeta/block-type-service'],
        resourceKinds: [
            'kapeta/resource-type-mongodb',
            'kapeta/resource-type-postgresql',
            'kapeta/resource-type-rest-api',
            'kapeta/resource-type-rest-client',
            'kapeta/resource-type-smtp-client',
        ],
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

const gatewayBlock = require('./blocks/kapeta-block-type-gateway-http.json');
BlockTypeProvider.register({
    kind: gatewayBlock.metadata.name,
    version: '1.2.3',
    editorComponent: null as any,
    resourceKinds: ['kapeta/resource-type-rest-client', 'kapeta/resource-type-web-fragment'],
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
    definition: gatewayBlock,
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
    shapeWidth: 150,
    getShapeHeight: (resourceHeight: number) => Math.max(140, resourceHeight + 50),
    shapeComponent: function ShapeComponent(props) {
        // Scaling the topbar svg to fit the block
        const block = useBlock();
        const svgWidth = 192;
        const svgHeight = 170 * (props.width / svgWidth);

        return (
            <g className="block-node" style={{ cursor: block.readOnly ? 'default' : 'move' }}>
                {/* Background */}
                <rect className="block-body" width={props.width} height={props.height} rx="6" fill="white" />

                {/* Border */}
                <rect
                    className="block-border"
                    x="0.5"
                    y="0.5"
                    width={props.width - 1}
                    height={props.height - 1}
                    rx="5.5"
                    fill="none"
                    stroke="black"
                    strokeOpacity="0.12"
                />
                {/* Topbar */}
                <svg width={props.width} height={svgHeight} viewBox="0 0 192 170" fill="none">
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

                <svg fill="none" x={props.width - 20} y={-30}>
                    <BlockStatus />
                </svg>
                {/* Offset if block has error */}
                <svg fill="none" x={props.width / 2} y={35} width={props.width - 20} viewBox="0 0 150 150">
                    <BlockInstanceName />
                </svg>
                <svg fill="none" x={props.width / 2} y={75}>
                    <BlockName />
                </svg>

                <svg x={props.width / 2} y={95}>
                    <BlockHandle />
                </svg>

                <svg y={props.height - 20} x={props.width / 2}>
                    <BlockVersion />
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
    shapeWidth: 120,
    getShapeHeight: (resourceHeight: number) => Math.max(160, resourceHeight + 60),
    shapeComponent: function ShapeComponent(props) {
        const block = useBlock();
        // Make the mobile block a bit smaller
        const svgWidth = 152;
        const svgHeight = 104 * (props.width / svgWidth);
        return (
            <g className="block-node" style={{ cursor: block.readOnly ? 'default' : 'move' }}>
                {/* Background */}
                <rect
                    className="block-body"
                    x={0}
                    y={0}
                    width={props.width}
                    fill="white"
                    height={props.height}
                    rx="5px"
                    ry="5px"
                />
                {/* Border */}
                <rect
                    className="block-border"
                    x="0.5"
                    y="0.5"
                    width={props.width - 1}
                    height={props.height - 1}
                    rx="5.5"
                    fill="none"
                    stroke="black"
                    strokeOpacity="0.12"
                />
                {/* Notch and pill */}
                <svg
                    width={props.width}
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
                <g transform={`translate(${props.width - 20}, -30)`}>
                    <BlockStatus />
                </g>
                {/* TODO: add y-offset if block has error */}
                <svg fill="none" x={props.width / 2} y={10} width={props.width - 20} viewBox="0 0 150 150">
                    <BlockInstanceName />
                </svg>
                {/* Name + handle */}
                <svg fill="none" x={props.width / 2} y={70}>
                    <BlockName />
                </svg>
                <svg x={props.width / 2} y={90}>
                    <BlockHandle />
                </svg>
                <svg y={props.height - 20} x={props.width / 2}>
                    <BlockVersion />
                </svg>
            </g>
        );
    },
    definition: mobileBlock,
});

export const BlockService: BlockStore = {
    async list(): Promise<Asset<BlockDefinition>[]> {
        return [...blocks];
    },
    async get(ref: string): Promise<Asset<BlockDefinition>> {
        const uri = parseKapetaUri(ref);
        const out = blocks.find((a) => {
            const aUri = parseKapetaUri(a.ref);
            return uri.fullName === aUri.fullName;
        });

        if (!out) {
            // eslint-disable-next-line no-console
            throw new Error('Could not find ref: ' + ref);
        }
        return out as Asset<BlockDefinition>;
    },
};
