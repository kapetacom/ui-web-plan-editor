/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { BlockDefinition, BlockInstance, EntityList, Plan } from '@kapeta/schemas';
import _ from 'lodash';
import { AssetInfo } from '../types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

type ConfigMap = { [key: string]: any };

export function resolveConfigurationFromDefinition(
    entities?: EntityList,
    config?: ConfigMap,
    globalConfiguration?: ConfigMap
): ConfigMap {
    if (!entities || !globalConfiguration) {
        return config || {};
    }

    const mergedConfig = config ? _.cloneDeep(config) : {};
    entities.types?.forEach((type) => {
        if (!type.properties) {
            return;
        }
        Object.entries(type.properties).forEach(([propertyName, property]) => {
            if (!property.global) {
                return;
            }

            const configPath = type.name + '.' + propertyName;
            const defaultValue = globalConfiguration ? _.get(globalConfiguration, configPath) : undefined;
            if (!_.has(mergedConfig, configPath)) {
                _.set(mergedConfig, configPath, defaultValue);
            }
        });
    });

    return mergedConfig;
}

export function createGlobalConfigurationFromEntities(entities?: EntityList, configuration?: ConfigMap) {
    if (!entities) {
        return undefined;
    }
    const defaultConfig = {};
    entities.types?.forEach((type) => {
        if (!type.properties) {
            return;
        }
        Object.entries(type.properties).forEach(([propertyName, property]) => {
            if (!property.global) {
                return;
            }

            const configPath = type.name + '.' + propertyName;
            const defaultValue = configuration ? _.get(configuration, configPath) : undefined;
            _.set(defaultConfig, configPath, defaultValue);
        });
    });

    return _.isEmpty(defaultConfig) ? undefined : defaultConfig;
}

/**
 * Removes connections that point to non-existing resources and duplicate connections.
 *
 * Will not remove connections that point to non-existing block definitions as those are assumed
 * to exist but not yet loaded.
 */
export function cleanupConnections(plan: Plan, blockAssets: AssetInfo<BlockDefinition>[]) {
    let anyDangling = false;
    const instanceBlocks: Record<string, AssetInfo<BlockDefinition>> = {};
    const instances: Record<string, BlockInstance> = {};
    plan.spec.blocks?.forEach((instance) => {
        const blockRef = parseKapetaUri(instance.block.ref);
        instances[instance.id] = instance;
        const asset = blockAssets.find((asset) => parseKapetaUri(asset.ref).equals(blockRef));
        if (!asset) {
            return;
        }
        instanceBlocks[instance.id] = asset;
    });

    const connectionSet = new Set<string>();

    const newConnections =
        plan.spec.connections?.filter((connection) => {
            const connectionId = `${connection.consumer.blockId}:${connection.consumer.resourceName}:${connection.provider.blockId}:${connection.provider.resourceName}:${connection.port?.type}`;
            if (connectionSet.has(connectionId)) {
                return false;
            }
            connectionSet.add(connectionId);

            const consumerInstance = instances[connection.consumer.blockId];
            const providerInstance = instances[connection.provider.blockId];
            if (!consumerInstance || !providerInstance) {
                anyDangling = true;
                return false;
            }

            const consumerBlock = instanceBlocks[connection.consumer.blockId];
            const providerBlock = instanceBlocks[connection.provider.blockId];

            if (!consumerBlock || !providerBlock) {
                // We don't deal with missing block definitions here
                return true;
            }

            const consumerResource = consumerBlock.content?.spec?.consumers?.find((consumer) => {
                return consumer.metadata.name === connection.consumer.resourceName;
            });

            const providerResource = providerBlock.content?.spec?.providers?.find((provider) => {
                return provider.metadata.name === connection.provider.resourceName;
            });

            if (!consumerResource || !providerResource) {
                anyDangling = true;
                return false;
            }

            return true;
        }) ?? [];

    if (!anyDangling) {
        return plan;
    }

    return {
        ...plan,
        spec: {
            ...plan.spec,
            connections: newConnections,
        },
    };
}
