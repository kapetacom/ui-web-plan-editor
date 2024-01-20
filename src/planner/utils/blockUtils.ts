/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { BlockDefinition, BlockInstance, BlockResource, Entity, EntityList, Resource } from '@kapeta/schemas';
import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { IBlockTypeProvider, ResourceRole } from '@kapeta/ui-web-types';
import { randomUUID } from '../../utils/cryptoUtils';
import { BLOCK_SIZE } from './planUtils';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockInfo } from '../types';
import { AssetInfo } from '../../types';
import _ from 'lodash';
import {
    DSLCompatibilityHelper,
    DSLData,
    DSLDataType,
    DSLEntityType,
    DSLReferenceResolver,
    DSLTypeHelper,
    KAPLANG_ID,
    KAPLANG_VERSION,
    KaplangWriter,
    DSLConverters,
} from '@kapeta/kaplang-core';
import { getBlockEntities } from '../hooks/useBlockEntitiesForResource';

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
    return fromBlock !== toBlock;
}

function resolveAllReferences(targets: DSLData[], entities: DSLData[], previouslyLookedUp: string[] = []): string[] {
    const referenceResolver = new DSLReferenceResolver();
    const referencedEntities = referenceResolver.resolveReferences(targets).map((name) => {
        const type = DSLTypeHelper.asType(name);
        return type.name;
    });
    if (referencedEntities.length > 0) {
        const referencedEntitiesData = referencedEntities
            .map((name) => {
                return entities.find((entity) => entity.name === name);
            })
            .filter((e) => {
                return e && !previouslyLookedUp.includes(e.name);
            }) as DSLData[];

        return Array.from(
            new Set<string>([
                ...referencedEntities,
                ...resolveAllReferences(referencedEntitiesData, entities, [
                    ...previouslyLookedUp,
                    ...referencedEntities,
                ]),
            ])
        );
    }

    return referencedEntities;
}

export function copyResourceToBlock(consumerBlock: BlockDefinition, provider: BlockResource): Resource | undefined {
    if (!canAddResourceToBlock(consumerBlock, provider.block)) {
        return undefined;
    }

    const fromEntities = getBlockEntities(provider.resource.kind, provider.block);
    const toEntities = getBlockEntities(provider.resource.kind, consumerBlock);

    // Get entities in use by resource being copied
    const directUseEntityNames = ResourceTypeProvider.resolveEntities(provider.resource);

    const directUseEntities = directUseEntityNames
        .map((entityName) => {
            const type = DSLTypeHelper.asType(entityName);
            return fromEntities.find((e) => e.name === type.name);
        })
        .filter((e) => !!e) as DSLData[];

    const referencedEntities = resolveAllReferences(directUseEntities, fromEntities);

    // Convert resource to consumable resource
    const newResource = ResourceTypeProvider.convertToConsumable(provider.resource);

    const allEntities = new Set<string>([...referencedEntities, ...directUseEntityNames]);
    const newEntities: DSLData[] = [];
    const renamedEntities: { [from: string]: string } = {};
    allEntities.forEach((entityName) => {
        const type = DSLTypeHelper.asType(entityName);
        const fromEntity = fromEntities.find((e) => e.name === type.name);
        if (!fromEntity) {
            return;
        }

        // See if target block already has an entity that is identical to this one
        const existingEntity = getMatchingEntityForName(fromEntity, fromEntities, toEntities);
        if (existingEntity) {
            // If already there no need to do anything
            return;
        }

        let conflictingEntity;
        let conflictCount = 1;
        const originalName = fromEntity.name;
        let addEntity = true;
        let toEntity = getMatchingEntityForSchema(fromEntity, fromEntities, toEntities);
        if (toEntity) {
            addEntity = false;
        } else {
            toEntity = _.cloneDeep(fromEntity);

            if (toEntity.annotations) {
                // We don't want to copy the native annotation
                toEntity.annotations = toEntity.annotations.filter((a) => {
                    return a.type !== '@Native';
                });
            }

            do {
                // Check if an entity exists of the same name - but different properties
                conflictingEntity = getConflictingEntity(toEntity, fromEntities, toEntities);

                if (conflictingEntity) {
                    // We need to rename the new entity and all references to it to be able to add it to the target block.
                    toEntity.name = `${originalName}_${conflictCount}`;
                    conflictCount++;
                }
            } while (conflictingEntity);
        }
        if (toEntity.name !== originalName) {
            // See if target block already has an entity that is identical to this one
            if (addEntity && getMatchingEntityForName(toEntity, fromEntities, toEntities)) {
                // If already there do not add
                addEntity = false;
            }

            if (directUseEntityNames.includes(originalName)) {
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

    const targetEntityList = [
        ...newEntities,
        ...toEntities.filter((e) => {
            // Skip native entities
            return !e.annotations?.some((a) => {
                return a.type === '@Native';
            });
        }),
    ];

    consumerBlock.spec.entities = createEntityList(targetEntityList);

    let counter = 1;
    let resourceName = newResource.metadata.name ?? provider.resource.metadata.name;

    while (hasResource(consumerBlock, resourceName, ResourceRole.CONSUMES)) {
        resourceName = `${newResource.metadata.name}_${counter}`;
        counter++;
    }

    newResource.metadata.name = resourceName;

    return newResource;
}

export function createEntityList(targetEntityList: DSLData[]): EntityList {
    const targetDataTypes = targetEntityList.filter((e) => e.type === DSLEntityType.DATATYPE) as DSLDataType[];

    return {
        types: targetEntityList
            .map((e) => DSLConverters.toSchemaEntity(e, targetDataTypes))
            .filter(Boolean) as Entity[],
        source: {
            type: KAPLANG_ID,
            version: KAPLANG_VERSION,
            value: KaplangWriter.write(targetEntityList),
        },
    };
}

export function applyEntityNameChanges(entities: DSLData[], nameChanges: { [from: string]: string }): void {
    Object.entries(nameChanges).forEach(([from, to]) => {
        entities.forEach((entity) => {
            if (entity.type !== DSLEntityType.DATATYPE) {
                return;
            }

            if (!entity.properties) {
                return;
            }

            entity.properties.forEach((property) => {
                if (DSLTypeHelper.isBuiltInType(property.type)) {
                    return;
                }

                const type = DSLTypeHelper.asType(property.type);

                if (from !== type.name) {
                    return;
                }

                type.name = to;
                property.type = type;
            });
        });
    });
}

function getEntityByName(entities: DSLData[], entityName: string): DSLData | undefined {
    if (!entities) {
        return undefined;
    }

    return entities.find((t: DSLData) => t.name === entityName);
}

function getMatchingEntityForName(
    entity: DSLData,
    sourceEntities: DSLData[],
    targetEntities: DSLData[]
): DSLData | undefined {
    const existingEntity = getEntityByName(targetEntities, entity.name);

    if (
        existingEntity &&
        DSLCompatibilityHelper.isDataCompatible(entity, existingEntity, sourceEntities, targetEntities)
    ) {
        return existingEntity;
    }

    return undefined;
}

function getMatchingEntityForSchema(
    entity: DSLData,
    sourceEntities: DSLData[],
    targetEntities: DSLData[]
): DSLData | undefined {
    return targetEntities.find((targetEntity) => {
        return DSLCompatibilityHelper.isDataCompatible(entity, targetEntity, sourceEntities, targetEntities);
    });
}

function getConflictingEntity(
    entity: DSLData,
    sourceEntities: DSLData[],
    targetEntities: DSLData[]
): DSLData | undefined {
    const namedEntity = getEntityByName(targetEntities, entity.name);
    if (namedEntity && !DSLCompatibilityHelper.isDataCompatible(entity, namedEntity, sourceEntities, targetEntities)) {
        return namedEntity;
    }

    return undefined;
}
