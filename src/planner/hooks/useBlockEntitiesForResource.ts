import { useMemo } from 'react';
import { BlockTargetProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockDefinition, Entity } from '@kapeta/schemas';
import { IncludeContextType } from '@kapeta/ui-web-types';
import { DSLConverters, DSLData, DSLDataType, DSLDataTypeParser, DSLEntityType } from '@kapeta/kaplang-core';

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

    if (resourceProvider.capabilities?.directDSL && block?.spec.entities?.source?.value) {
        const code = [block.spec.entities.source.value];
        if (useIncludes && targetProvider?.getDSLIncludes) {
            const include = targetProvider.getDSLIncludes(contextType);
            if (include?.source) {
                code.push(include.source);
            }
        }
        return DSLDataTypeParser.parse(code.join('\n\n'), {
            ignoreSemantics: true,
        });
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
