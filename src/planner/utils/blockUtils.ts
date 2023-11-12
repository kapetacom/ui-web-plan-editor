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
    isBuiltInType,
    isDTO,
    isList,
    isSchemaEntityCompatible,
    Resource,
    typeName,
} from '@kapeta/schemas';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { IBlockTypeProvider, ResourceRole } from '@kapeta/ui-web-types';
import { randomUUID } from '../../utils/cryptoUtils';
import { BLOCK_SIZE } from './planUtils';
import { DSL_LANGUAGE_ID, DSLConverters, DSLEntity, DSLWriter } from '@kapeta/dsl-editor';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockInfo } from '../types';
import { AssetInfo } from '../../types';
import _ from 'lodash';

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
    const directUseEntities = ResourceTypeProvider.resolveEntities(provider.resource);

    // Get entities in use by entities in use by resource being copied
    const referencedEntities: string[] = [];
    directUseEntities.forEach((entityName) => {
        const entity = fromEntities.find((e) => e.name === entityName);
        if (!entity) {
            return;
        }

        resolveEntitiesFromEntity(entity, fromEntities).forEach((e) => {
            if (referencedEntities.indexOf(e.name) === -1) {
                referencedEntities.push(e.name);
            }
        });
    });

    // Convert resource to consumable resource
    const newResource = ResourceTypeProvider.convertToConsumable(provider.resource);

    const allEntities = new Set<string>([...directUseEntities, ...referencedEntities]);
    const newEntities: Entity[] = [];
    const renamedEntities: { [from: string]: string } = {};
    allEntities.forEach((entityName) => {
        const fromEntity = fromEntities.find((e) => e.name === entityName);
        if (!fromEntity) {
            return;
        }

        // See if target block already has an entity that is identical to this one
        const existingEntity = getMatchingEntityForName(consumerBlock, fromEntity, fromEntities);
        if (existingEntity) {
            // If already there no need to do anything
            return;
        }

        let conflictingEntity;
        let conflictCount = 1;
        const originalName = fromEntity.name;
        let addEntity = true;
        let toEntity = getMatchingEntityForSchema(consumerBlock, fromEntity, fromEntities);
        if (toEntity) {
            addEntity = false;
        } else {
            toEntity = _.cloneDeep(fromEntity);

            do {
                // Check if an entity exists of the same name - but different properties
                conflictingEntity = getConflictingEntity(consumerBlock, toEntity, fromEntities);

                if (conflictingEntity) {
                    // We need to rename the new entity and all references to it to be able to add it to the target block.
                    toEntity.name = `${originalName}_${conflictCount}`;
                    conflictCount++;
                }
            } while (conflictingEntity);
        }
        if (toEntity.name !== originalName) {
            // See if target block already has an entity that is identical to this one
            if (addEntity && getMatchingEntityForName(consumerBlock, toEntity, fromEntities)) {
                // If already there do not add
                addEntity = false;
            }

            if (directUseEntities.includes(originalName)) {
                // We need to change the ref name in the resource
                ResourceTypeProvider.renameEntityReferences(newResource, originalName, toEntity.name);
            }

            renamedEntities[originalName] = toEntity.name;
        }

        if (addEntity) {
            newEntities.push(toEntity);
        }
    });

    applyEntityNameChanges(newEntities, renamedEntities);

    newEntities.forEach((entity) => {
        consumerBlock.spec.entities = addEntity(entity, consumerBlock.spec.entities);
    });

    newResource.metadata.name = resourceName;

    return newResource;
}

export function applyEntityNameChanges(entities: Entity[], nameChanges: { [from: string]: string }): void {
    Object.entries(nameChanges).forEach(([from, to]) => {
        entities.forEach((entity) => {
            if (!isDTO(entity)) {
                return;
            }

            Object.values(entity.properties).forEach((property) => {
                if (isBuiltInType(property)) {
                    return;
                }

                if (from !== typeName(property)) {
                    return;
                }

                // Change the reference in the entity
                if (isList(property)) {
                    property.ref = to + '[]';
                } else {
                    property.ref = to;
                }
            });
        });
    });
}

function getEntityByName(block: BlockDefinition, entityName: string): Entity | undefined {
    if (!block.spec.entities?.types) {
        return undefined;
    }

    return block.spec.entities.types.find((t: Entity) => t.name === entityName);
}

function getMatchingEntityForName(
    block: BlockDefinition,
    entity: Entity,
    sourceEntities: Entity[]
): Entity | undefined {
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

function getMatchingEntityForSchema(
    block: BlockDefinition,
    entity: Entity,
    sourceEntities: Entity[]
): Entity | undefined {
    return block.spec.entities?.types?.find((targetEntity: Entity) => {
        return isSchemaEntityCompatible(entity, targetEntity, sourceEntities, block.spec?.entities?.types ?? []);
    });
}

function getConflictingEntity(block: BlockDefinition, entity: Entity, sourceEntities: Entity[]): Entity | undefined {
    const namedEntity = getEntityByName(block, entity.name);
    let conflictingEntity;

    if (
        namedEntity &&
        !isSchemaEntityCompatible(entity, namedEntity, sourceEntities, block.spec?.entities?.types ?? [])
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
                value: DSLWriter.write(target.map(DSLConverters.fromSchemaEntity).filter(Boolean) as DSLEntity[]),
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

    const code = DSLWriter.write([DSLConverters.fromSchemaEntity(entity)].filter(Boolean) as DSLEntity[]);
    targets.source.value += '\n\n' + code;
    targets.source.value = targets.source.value.trim();
    targets.types = [...targets.types, entity];

    return { ...target };
}

export function resolveEntitiesFromEntity(entity: Entity, entities: Entity[]): Entity[] {
    if (!isDTO(entity)) {
        return [];
    }

    const out: string[] = [];

    Object.values(entity.properties).forEach((property) => {
        if (typeof property.type === 'string') {
            return;
        }

        const name = typeName(property);
        if (entity.name === name) {
            return;
        }

        if (out.indexOf(name) > -1) {
            return;
        }

        out.push(name);

        const subEntity = entities.find((e) => e.name === name);

        if (subEntity) {
            const subEntityEntities = resolveEntitiesFromEntity(subEntity, entities);
            subEntityEntities.forEach((e) => {
                if (out.indexOf(e.name) === -1) {
                    out.push(e.name);
                }
            });
        }
    });

    return out.map((name) => entities.find((e) => e.name === name)).filter((e) => !!e) as Entity[];
}
