import { BlockService, BlockTargetProvider, BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { ResourceRole, ResourceType } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { cloneDeep } from 'lodash';

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
        type: ResourceType.DATABASE,
        role: ResourceRole.CONSUMES,
    });
});

[require('./blocks/kapeta-resource-type-rest-client.json')].forEach((resource) => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceType.SERVICE,
        role: ResourceRole.CONSUMES,
        converters: [{ fromKind: 'kapeta/resource-type-rest-api' }],
        getCounterValue() {
            return 2;
        },
    });
});

[require('./blocks/kapeta-resource-type-rest-api.json')].forEach((resource) => {
    ResourceTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        title: resource.metadata.title,
        type: ResourceType.SERVICE,
        role: ResourceRole.PROVIDES,
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
    });
});

['kapeta/language-target-java-spring-boot', 'kapeta/language-target-test'].forEach((targetKind) => {
    BlockTargetProvider.register({
        kind: targetKind,
        version: '1.2.3',
        title: 'Test',
        blockKinds: ['kapeta/block-type-service'],
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
    });
});

[require('./blocks/kapeta-block-type-service.json')].forEach((resource) => {
    BlockTypeProvider.register({
        kind: resource.metadata.name,
        version: '1.2.3',
        componentType: null as any,
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
    });
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
