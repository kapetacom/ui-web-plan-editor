import React from 'react';
import {BlockService, BlockTypeProvider, ResourceTypeProvider} from "@blockware/ui-web-context";
import {ResourceRole, ResourceType} from "@blockware/ui-web-types";
import {parseBlockwareUri} from '@blockware/nodejs-utils';

export const BlockServiceMock = BlockService;

const blocks = [
    require('./blocks/blockware-user.json'),
    require('./blocks/blockware-todo.json'),
    require('./blocks/blockware-images.json')
].map(data => {
    return {
        ref: data.metadata.name + ':1.2.3',
        path: '.',
        kind: data.kind,
        data: data,
        exists: true,
        ymlPath: '.',
        version: '1.2.3',
        editable: true
    }
});

blocks.push(...[
    require('./blocks/blockware-user.json'),
    require('./blocks/blockware-todo.json'),
    require('./blocks/blockware-images.json')
].map(data => {
    return {
        ref: data.metadata.name + ':1.0.2',
        path: '.',
        kind: data.kind,
        data: data,
        exists: true,
        ymlPath: '.',
        version: '1.0.2',
        editable: true
    }
}));

blocks.push(...[
    require('./blocks/blockware-user.json'),
    require('./blocks/blockware-todo.json'),
    require('./blocks/blockware-images.json')
].map(data => {
    return {
        ref: data.metadata.name + ':local',
        path: '.',
        kind: data.kind,
        data: data,
        exists: true,
        ymlPath: '.',
        version: 'local',
        editable: true
    }
}));

[
    require('./blocks/blockware-resource-type-mongodb.json'),
    require('./blocks/blockware-resource-type-postgresql.json')
].forEach(resource => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceType.DATABASE,
        role: ResourceRole.CONSUMES
    });
});

[
    require('./blocks/blockware-resource-type-rest-client.json')
].forEach(resource => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceType.SERVICE,
        role: ResourceRole.CONSUMES,
        converters: [
            {fromKind: 'blockware/resource-type-rest-api'}
        ]
    });
});

[
    require('./blocks/blockware-resource-type-rest-api.json')
].forEach(resource => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceType.SERVICE,
        role: ResourceRole.PROVIDES,
    });
});

[
    require('./blocks/blockware-block-type-service.json')
].forEach(resource => {
    BlockTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        componentType: null as any
    });
})


//Mock getter
BlockServiceMock.list = async () => {
    return [
        ...blocks
    ]
};

// @ts-ignore
BlockServiceMock.get = async (ref) => {
    const uri = parseBlockwareUri(ref);
    const out = blocks.find(a => {
        const aUri = parseBlockwareUri(a.ref);
        return uri.fullName === aUri.fullName;
    });
    if (!out) {
        console.error('Could not find ref: ', ref);
    }
    return out;
};
