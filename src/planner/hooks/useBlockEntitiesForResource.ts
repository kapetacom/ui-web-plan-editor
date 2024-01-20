/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import { useMemo } from 'react';
import { BlockTargetProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockDefinition, Entity } from '@kapeta/schemas';
import { IncludeContextType } from '@kapeta/ui-web-types';
import {
    DSLConverters,
    DSLData,
    DSLDataType,
    DSLDataTypeParser,
    DSLEntityType,
    DSLTypeHelper,
} from '@kapeta/kaplang-core';

export const getBlockEntities = (
    resourceKind: string,
    block?: BlockDefinition,
    useIncludes: boolean = true,
    contextType: IncludeContextType = IncludeContextType.REST
): DSLData[] => {
    const resourceProvider = ResourceTypeProvider.get(resourceKind);

    const targetProvider = block?.spec.target?.kind
        ? BlockTargetProvider.get(block.spec.target.kind, block.kind)
        : null;
    let includes: DSLData[] = [];
    let result: DSLData[] = [];
    if (resourceProvider.capabilities?.directDSL) {
        if (useIncludes && targetProvider?.getDSLIncludes) {
            const include = targetProvider.getDSLIncludes(contextType);
            if (include?.source) {
                try {
                    includes = DSLDataTypeParser.parse(include?.source, {
                        ignoreSemantics: true,
                    });
                } catch (e: any) {
                    console.error('Failed to parse included source', e);
                }
            }
        }
        try {
            if (block?.spec.entities?.source?.value) {
                result = DSLDataTypeParser.parse(block.spec.entities.source.value, {
                    validTypes: includes.map((i) => DSLTypeHelper.asFullName(i.name, true)),
                    ignoreSemantics: true,
                });
            }
        } catch (e: any) {
            console.error('Failed to parse source', e);
        }

        return [...result, ...includes];
    }

    const entities = block?.spec.entities?.types ?? ([] as Entity[]);

    return entities.map(DSLConverters.fromSchemaEntity).filter((entity) => entity !== undefined) as DSLData[];
};

export const isDirectDSL = (resourceKind: string): boolean => {
    const resourceProvider = ResourceTypeProvider.get(resourceKind);
    return resourceProvider.capabilities?.directDSL ?? false;
};

export const transformEntities = (resourceKind: string, entities: DSLData[]): any => {
    const resourceProvider = ResourceTypeProvider.get(resourceKind);
    if (resourceProvider.capabilities?.directDSL) {
        return entities;
    }

    const dataTypes = entities.filter((e) => e.type === DSLEntityType.DATATYPE) as DSLDataType[];
    return entities.map((e) => DSLConverters.toSchemaEntity(e, dataTypes)) as any;
};

export const useBlockEntities = (
    resourceKind: string,
    block?: BlockDefinition,
    useIncludes: boolean = true,
    contextType: IncludeContextType = IncludeContextType.REST
) => {
    return useMemo(() => {
        return getBlockEntities(resourceKind, block, useIncludes, contextType);
    }, [resourceKind, block, contextType]);
};

export const useDirectDSL = (resourceKind: string) => {
    return useMemo(() => {
        return isDirectDSL(resourceKind);
    }, [resourceKind]);
};

export const useTransformEntities = (resourceKind: string, entities: DSLData[]) => {
    return useMemo(() => {
        return transformEntities(resourceKind, entities);
    }, [resourceKind, entities]);
};

export const useDSLEntityIncludes = (
    blockKind: string,
    targetKind: string | undefined,
    contextType: IncludeContextType = IncludeContextType.REST
) => {
    return useMemo<string[]>(() => {
        if (!targetKind) {
            return [];
        }
        const targetProvider = BlockTargetProvider.get(targetKind, blockKind);

        if (targetProvider?.getDSLIncludes) {
            const include = targetProvider.getDSLIncludes(contextType);
            if (include?.source) {
                try {
                    return DSLDataTypeParser.parse(include?.source, {
                        ignoreSemantics: true,
                    }).map((i) => DSLTypeHelper.asFullName(i, true));
                } catch (e: any) {
                    console.error('Failed to parse included source', e);
                }
            }
        }
        return [];
    }, [targetKind, blockKind, contextType]);
};
