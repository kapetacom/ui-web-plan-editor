import React from 'react';
import {BlockService, BlockTypeProvider, ResourceTypeProvider} from "@blockware/ui-web-context";
import {BlockConfigProps, ResourceRole, ResourceType} from "@blockware/ui-web-types";

const BlockServiceMock = BlockService;

const blocks = [
    require('./blocks/blockware-user.json'),
    require('./blocks/blockware-todo.json')
].map(data => {
    return {
        ref: data.metadata.name,
        path: '.',
        kind: data.kind,
        data: data,
        exists: true,
        ymlPath: '.',
        version: '1.2.3',
        editable: true
    }
});

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
        role: ResourceRole.CONSUMES
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
        role: ResourceRole.PROVIDES
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

BlockServiceMock.get = async (ref) => {
    const out = blocks.find(a => a.ref === ref);
    if (!out) {
        console.error('Could not find ref: ', ref);
    }
    return out;
};

export default BlockServiceMock;