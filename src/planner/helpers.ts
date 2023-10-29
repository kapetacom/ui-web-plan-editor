/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { EntityList } from '@kapeta/schemas';
import _ from 'lodash';

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
