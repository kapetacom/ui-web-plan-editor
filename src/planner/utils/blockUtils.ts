/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import {
    BlockDefinition,
    BlockInstance,
    BlockResource,
    Entity,
    EntityList,
    isSchemaEntityCompatible,
    Resource,
} from '@kapeta/schemas';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { IBlockTypeProvider, ResourceRole } from '@kapeta/ui-web-types';
import { randomUUID } from '../../utils/cryptoUtils';
import { BLOCK_SIZE } from './planUtils';
import { DSL_LANGUAGE_ID, DSLConverters, DSLWriter } from '@kapeta/ui-web-components';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockInfo } from '../types';
import { AssetInfo } from '../../types';

export function createBlockInstanceForBlock(blockAsset: AssetInfo<BlockDefinition>): BlockInstance {
    return {
        block: {
            ref: blockAsset.ref,
        },
        dimensions: {
            width: BLOCK_SIZE,
            height: -1,
            top: 0,
            left: 0,
        },
        id: randomUUID(),
        name: blockAsset.content.metadata.title ?? blockAsset.content.metadata.name,
    };
}

export function getLocalRefForBlockDefinition(block: BlockDefinition) {
    return `kapeta://${block.metadata.name}:local`;
}

export function createBlockInstanceForBlockType(ref: string, provider: IBlockTypeProvider): BlockInfo {
    const kind = provider.definition.metadata.name + ':' + provider.version;
    const refUri = parseKapetaUri(ref);

    const block: BlockDefinition = {
        kind,
        metadata: {
            name: refUri.fullName,
        },
        spec: {
            entities: {},
            providers: [],
            consumers: [],
        },
    };

    const instance: BlockInstance = {
        block: {
            ref,
        },
        dimensions: {
            width: BLOCK_SIZE,
            height: -1,
            top: 0,
            left: 0,
        },
        id: randomUUID(),
        name: '',
    };

    return { block, instance };
}

export function hasResource(toBlock: BlockDefinition, name: string, role: ResourceRole) {
    const resources = role === ResourceRole.CONSUMES ? toBlock.spec.consumers : toBlock.spec.providers;
    if (!resources) {
        return false;
    }
    return resources.some((r) => r.metadata.name === name);
}

export function canAddResourceToBlock(toBlock: BlockDefinition, fromBlock: BlockDefinition) {
    if (fromBlock === toBlock) {
        return false;
    }

    return true;
}

export function copyResourceToBlock(consumerBlock: BlockDefinition, provider: BlockResource): Resource | undefined {
    if (!canAddResourceToBlock(consumerBlock, provider.block)) {
        return undefined;
    }

    let counter = 1;
    let resourceName = provider.resource.metadata.name;

    while (hasResource(consumerBlock, resourceName, ResourceRole.CONSUMES)) {
        resourceName = `${provider.resource.metadata.name}_${counter}`;
        counter++;
    }

    const fromEntities = provider.block.spec.entities?.types ?? [];

    // Get entities in use by resource being copied
    const entityNames = ResourceTypeProvider.resolveEntities(provider.resource);

    // Convert resource to consumable resource
    const newResource = ResourceTypeProvider.convertToConsumable(provider.resource);

    entityNames.forEach((entityName) => {
        const entity = fromEntities.find((e) => e.name === entityName);
        if (!entity) {
            return;
        }

        // See if target block already has an entity that is identical to this one
        const existingEntity = getMatchingEntity(consumerBlock, entity, fromEntities);
        if (existingEntity) {
            // If already there no need to do anything
            return;
        }

        let conflictingEntity;
        let conflictCount = 1;
        const originalName = entity.name;
        do {
            // Check if an entity exists of the same name - but different properties
            conflictingEntity = getConflictingEntity(consumerBlock, entity, fromEntities);

            if (conflictingEntity) {
                // We need to rename the new entity and all references to it to be able to add it to the target block.
                entity.name = `${originalName}_${conflictCount}`;
                conflictCount++;
            }
        } while (conflictingEntity);

        if (entity.name !== originalName) {
            // We need to change our references
            ResourceTypeProvider.renameEntityReferences(newResource, originalName, entity.name);
        }

        consumerBlock.spec.entities = addEntity(entity, consumerBlock.spec.entities);
    });

    newResource.metadata.name = resourceName;

    return newResource;
}

function getEntityByName(block: BlockDefinition, entityName: string): Entity | undefined {
    if (!block.spec.entities?.types) {
        return undefined;
    }

    return block.spec.entities.types.find((t: Entity) => t.name === entityName);
}

function getMatchingEntity(block: BlockDefinition, entity: Entity, sourceEntities: Entity[]): Entity | undefined {
    const namedEntity = getEntityByName(block, entity.name);
    let matchedEntity;

    if (
        namedEntity &&
        isSchemaEntityCompatible(entity, namedEntity, sourceEntities, block.spec?.entities?.types ?? [])
    ) {
        matchedEntity = namedEntity;
    }

    return matchedEntity;
}

function getConflictingEntity(block: BlockDefinition, entity: Entity, sourceEntities: Entity[]): Entity | undefined {
    const namedEntity = getEntityByName(block, entity.name);
    let conflictingEntity;

    if (
        namedEntity &&
        isSchemaEntityCompatible(entity, namedEntity, sourceEntities, block.spec?.entities?.types ?? [])
    ) {
        conflictingEntity = namedEntity;
    }

    return conflictingEntity;
}

function addEntity(entity: Entity, target?: EntityList) {
    let targets = target || {
        types: [],
        source: {
            type: DSL_LANGUAGE_ID,
            value: '',
        },
    };

    if (Array.isArray(target)) {
        targets = {
            types: target,
            source: {
                type: DSL_LANGUAGE_ID,
                value: DSLWriter.write(target.map(DSLConverters.fromSchemaEntity)),
            },
        };
    }

    if (!targets.types) {
        targets.types = [];
    }

    if (!targets.source) {
        targets.source = {
            type: DSL_LANGUAGE_ID,
            value: '',
        };
    }

    const code = DSLWriter.write([DSLConverters.fromSchemaEntity(entity)]);
    targets.source.value += '\n\n' + code;
    targets.source.value = targets.source.value.trim();
    targets.types = [...targets.types, entity];

    return { ...target };
}
