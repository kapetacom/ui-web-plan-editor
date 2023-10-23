import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { useAsync } from 'react-use';
import { TableCell, TableRow } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { ReferenceType } from '../validation/PlanReferenceValidation';
import React from 'react';
import { Tile } from './Tiles';
import { BlockReferenceResolverItem } from './BlockReferenceResolverItem';
import { ProviderReferenceResolverItem } from './ProviderReferenceResolverItem';
import { ItemProps } from './types';

export const ReferenceResolverItem = (props: ItemProps) => {
    const blockUri = parseKapetaUri(props.missingReference.blockRef);
    const refUri = parseKapetaUri(props.missingReference.ref);
    const readOnlyBlock = blockUri.version !== 'local';

    const canInstall = useAsync(async () => {
        return Boolean(refUri.version !== 'local' && (await props.assetCanBeInstalled(props.missingReference.ref)));
    }, [props.missingReference.ref, refUri.version]);

    if (canInstall.loading && refUri.version !== 'local') {
        return (
            <TableRow>
                <TableCell>
                    <Tile>Please wait while loading...</Tile>
                </TableCell>
                <TableCell align={'center'}>
                    <ArrowForward />
                </TableCell>
                <TableCell>
                    <Tile />
                </TableCell>
            </TableRow>
        );
    }

    if (props.missingReference.type === ReferenceType.BLOCK) {
        return (
            <BlockReferenceResolverItem
                {...props}
                readOnlyBlock={readOnlyBlock}
                canInstall={canInstall.value}
                blockUri={blockUri}
                refUri={refUri}
                resolution={props.resolution}
                onResolution={props.onResolution}
            />
        );
    }

    return (
        <ProviderReferenceResolverItem
            {...props}
            readOnlyBlock={readOnlyBlock}
            canInstall={canInstall.value}
            blockUri={blockUri}
            refUri={refUri}
            resolution={props.resolution}
            onResolution={props.onResolution}
        />
    );
};
