/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useEffect, useMemo } from 'react';
import { ReferenceType } from '../validation/PlanReferenceValidation';
import { ProviderBase } from '@kapeta/ui-web-types';
import { AssetVersionSelectorEntry } from '@kapeta/ui-web-components';
import { normalizeKapetaUri } from '@kapeta/nodejs-utils';
import { ActionType, InnerItemProps } from './types';

export function shortenPathName(path: string) {
    const parts = path.split(/[\\/]/g);
    if (parts.length > 2) {
        return parts[parts.length - 2];
    }

    return path;
}

export function toRef(fullName: string, version: string) {
    return fullName + ':' + version;
}

export const useAvailableActions = (
    props: InnerItemProps,
    alternativeVersionCount: number,
    availableTypeCount: number
) => {
    const availableActions = useMemo(() => {
        const out: ActionType[] = [];
        if (props.canInstall) {
            out.push(ActionType.INSTALL);
        }

        if (!props.readOnlyPlan) {
            if (props.selectAssetFromDisk && props.refUri.version === 'local') {
                out.push(ActionType.SELECT_LOCAL_VERSION);
            }

            if (!props.readOnlyBlock || props.missingReference.type === ReferenceType.BLOCK) {
                // We can only change version or type if the block is not read-only
                // or if the reference is a block reference itself (in which case we change the plan)
                if (alternativeVersionCount > 0) {
                    out.push(ActionType.SELECT_ALTERNATIVE_VERSION);
                } else if (availableTypeCount > 0) {
                    // We only allow changing the type if there are no versions available
                    out.push(ActionType.SELECT_ALTERNATIVE_TYPE);
                }
            }

            out.push(ActionType.REMOVE_BLOCK);
        }

        return out;
    }, [props.canInstall, props.refUri.version, availableTypeCount, alternativeVersionCount]);

    useEffect(() => {
        if (props.resolution.action === ActionType.NONE && availableActions.includes(ActionType.INSTALL)) {
            props.onResolution({
                action: ActionType.INSTALL,
            });
        }
    }, [availableActions]);

    return availableActions;
};

export const providerToSelectorMapper = (provider: ProviderBase<any>): AssetVersionSelectorEntry => {
    return {
        ref: normalizeKapetaUri(provider.definition.metadata.name + ':' + provider.version),
        kind: provider.definition.kind,
        icon: provider.icon,
        title: provider.title,
    };
};
