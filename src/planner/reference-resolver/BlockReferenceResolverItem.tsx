import { AssetVersionSelectorEntry, CoreTypes } from '@kapeta/ui-web-components';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { TableCell, TableRow } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { ActionSelector } from './ActionSelector';
import React from 'react';
import { createSubTitle, ReferenceTile } from './Tiles';
import { ActionType, InnerItemProps } from './types';
import { useAvailableActions } from './helpers';
import { ResolutionStateDisplay } from './ResolutionStateDisplay';

export const BlockReferenceResolverItem = (props: InnerItemProps) => {
    const alternativeVersions: AssetVersionSelectorEntry[] = props.blockAssets
        .filter((b) => parseKapetaUri(b.ref).fullName === props.refUri.fullName)
        .map((asset) => {
            return {
                title: asset.content.metadata.name ?? asset.content.metadata.title,
                icon: asset.content.spec.icon,
                kind: asset.content.kind,
                ref: asset.ref,
            };
        });

    const availableActions: ActionType[] = useAvailableActions(props, alternativeVersions.length, 0);

    let message = alternativeVersions.length > 0 ? `Block version not found` : `Block not found`;

    let kind: string = CoreTypes.BLOCK_TYPE;
    if (alternativeVersions.length > 0) {
        kind = alternativeVersions[0].kind;
    }

    const subtitle = createSubTitle(alternativeVersions.length > 0, props.refUri);

    return (
        <TableRow>
            <TableCell>
                <ReferenceTile title={message} subtitle={subtitle} kind={kind} />
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
                        alternativeVersions={alternativeVersions}
                        alternativeTypes={[]}
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
