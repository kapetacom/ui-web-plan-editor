/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { normalizeKapetaUri } from '@kapeta/nodejs-utils';
import { ProviderBase, ResourceRole } from '@kapeta/ui-web-types';
import { ReferenceType } from '../validation/PlanReferenceValidation';
import { CoreTypes } from '@kapeta/ui-web-components';
import { BlockTargetProvider, BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { IconValue } from '@kapeta/schemas';
import { TableCell, TableRow } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { ActionSelector } from './ActionSelector';
import React from 'react';
import { ActionType, InnerItemProps } from './types';
import { providerToSelectorMapper, toRef, useAvailableActions } from './helpers';
import { createSubTitle, ReferenceTile } from './Tiles';
import { ResolutionStateDisplay } from './ResolutionStateDisplay';

export const ProviderReferenceResolverItem = (props: InnerItemProps) => {
    if (!props.missingReference.blockRef) {
        return null;
    }

    const blockAsset = props.blockAssets.find(
        (b) =>
            props.missingReference.blockRef &&
            normalizeKapetaUri(b.ref) === normalizeKapetaUri(props.missingReference.blockRef)
    );

    if (!blockAsset) {
        return null;
    }

    let alternativeVersions: ProviderBase<any>[] = [];
    let availableTypes: ProviderBase<any>[] = [];
    let typeName = '';
    let kind = '';

    switch (props.missingReference.type) {
        case ReferenceType.TARGET:
            typeName = 'Language target';
            kind = CoreTypes.LANGUAGE_TARGET;
            alternativeVersions = BlockTargetProvider.getVersionsFor(props.refUri.fullName).map((version) => {
                return BlockTargetProvider.get(toRef(props.refUri.fullName, version), blockAsset.content.kind);
            });
            availableTypes = BlockTargetProvider.list(blockAsset.content.kind);
            break;
        case ReferenceType.PROVIDER:
            typeName = 'Provider resource';
            kind = CoreTypes.PROVIDER_INTERNAL;
            alternativeVersions = ResourceTypeProvider.getVersionsFor(props.refUri.fullName).map((version) => {
                return ResourceTypeProvider.get(toRef(props.refUri.fullName, version));
            });
            availableTypes = ResourceTypeProvider.list().filter((t) => t.role === ResourceRole.PROVIDES);
            break;
        case ReferenceType.CONSUMER:
            typeName = 'Consumer resource';
            kind = CoreTypes.PROVIDER_INTERNAL;
            alternativeVersions = ResourceTypeProvider.getVersionsFor(props.refUri.fullName).map((version) => {
                return ResourceTypeProvider.get(toRef(props.refUri.fullName, version));
            });
            availableTypes = ResourceTypeProvider.list().filter((t) => t.role === ResourceRole.CONSUMES);
            break;
        case ReferenceType.KIND:
            typeName = 'Block kind';
            kind = CoreTypes.BLOCK_TYPE;
            alternativeVersions = BlockTypeProvider.getVersionsFor(props.refUri.fullName).map((version) => {
                return BlockTypeProvider.get(toRef(props.refUri.fullName, version));
            });
            availableTypes = BlockTypeProvider.list();
            break;
    }

    const availableActions: ActionType[] = useAvailableActions(
        props,
        alternativeVersions.length,
        availableTypes.length
    );

    let icon: IconValue | undefined = undefined;

    if (alternativeVersions.length > 0) {
        kind = alternativeVersions[0].definition.kind;
        icon = alternativeVersions[0].icon;
        if (alternativeVersions[0].title) {
            typeName = alternativeVersions[0].title;
        }
    }

    let message = alternativeVersions.length > 0 ? `${typeName} version not found` : `${typeName} not found`;

    const blockInstance = props.plan?.spec?.blocks?.find((b) => b.id === props.missingReference.instanceId);

    const blockTitle = blockInstance?.name ?? blockAsset.content.metadata.title ?? blockAsset.content.metadata.name;

    const subtitle = createSubTitle(alternativeVersions.length > 0, props.refUri);

    return (
        <TableRow>
            <TableCell>
                <ReferenceTile blockTitle={blockTitle} title={message} subtitle={subtitle} kind={kind} icon={icon} />
            </TableCell>
            <TableCell align={'center'}>
                <ArrowForward />
            </TableCell>
            <TableCell>
                {props.resolutionState ? (
                    <ResolutionStateDisplay resolutionState={props.resolutionState} />
                ) : (
                    <ActionSelector
                        resolution={props.resolution}
                        alternativeVersions={alternativeVersions.map(providerToSelectorMapper)}
                        alternativeTypes={availableTypes.map(providerToSelectorMapper)}
                        availableActions={availableActions}
                        selectAssetFromDisk={props.selectAssetFromDisk}
                        onResolution={props.onResolution}
                        showErrors={props.showErrors}
                    />
                )}
            </TableCell>
        </TableRow>
    );
};
