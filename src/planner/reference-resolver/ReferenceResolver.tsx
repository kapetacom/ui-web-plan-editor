/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Alert, Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { ReferenceResolverItem } from './ReferenceResolverItem';
import { ActionType, MissingReferenceResolution, NO_RESOLUTION, ReferenceResolverProps } from './types';
import { isResolutionValid } from './ActionSelector';
import { Waiter } from './Waiter';

interface Props extends ReferenceResolverProps {
    onDelayingCheck?: (delaying: boolean) => void;
}

export const ReferenceResolver = (props: Props) => {
    // We delay showing the missing references a bit to allow for self-correction to happen
    const [delayingCheck, setDelayingCheck] = useState(false);
    const [resolutions, setResolutions] = useState<MissingReferenceResolution[]>([
        ...props.missingReferences.map((mf) => {
            return {
                ...mf,
                resolution: NO_RESOLUTION,
            };
        }),
    ]);

    useEffect(() => {
        if (props.missingReferences.length === 0) {
            setDelayingCheck(false);
            setResolutions([]);
            return () => {};
        }

        setDelayingCheck(true);
        const missingReferences = props.missingReferences;
        const timeout = setTimeout(() => setDelayingCheck(false), props.delayedCheck ?? 0);
        return () => {
            clearTimeout(timeout);
            setResolutions((prevState) => {
                return missingReferences.map((ref, ix) => {
                    return {
                        ...ref,
                        resolution: prevState[ix]?.resolution ?? NO_RESOLUTION,
                    };
                });
            });
            setDelayingCheck(false);
        };
    }, [props.missingReferences]);

    useEffect(() => {
        props.onDelayingCheck?.(delayingCheck);
    }, [props.onDelayingCheck, delayingCheck]);

    const valid = useMemo(() => {
        return resolutions.every((r) => isResolutionValid(r.resolution));
    }, [resolutions]);

    useEffect(() => {
        props.onChange(resolutions, valid);
    }, [resolutions, valid]);

    const unresolvable = useMemo(() => {
        return resolutions.some((r) => r.resolution?.action === ActionType.NONE_AVAILABLE);
    }, [resolutions]);

    return (
        <Box
            className={'reference-resolver'}
            sx={{
                minWidth: '900px',
            }}
        >
            {delayingCheck && <Waiter />}
            {!delayingCheck && (
                <>
                    <Alert severity={'error'}>
                        {unresolvable ? (
                            <>
                                The plan has missing references which can not be resolved. Please{' '}
                                <a href="mailto:support@kapeta.com" target={'_blank'}>
                                    contact support
                                </a>{' '}
                                for further assistance
                            </>
                        ) : (
                            'The plan has missing references. Please resolve them before continuing.'
                        )}
                    </Alert>
                    <Table size={'small'}>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        width: '400px',
                                    }}
                                >
                                    Missing reference
                                </TableCell>
                                <TableCell
                                    sx={{
                                        width: '24px',
                                    }}
                                />
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {resolutions.map((missingReferenceResolution, index) => {
                                return (
                                    <ReferenceResolverItem
                                        key={index}
                                        plan={props.plan}
                                        missingReference={missingReferenceResolution}
                                        readOnlyPlan={props.readOnly}
                                        assetCanBeInstalled={props.assetCanBeInstalled}
                                        blockAssets={props.blockAssets}
                                        showErrors={props.showErrors}
                                        selectAssetFromDisk={props.selectAssetFromDisk}
                                        resolution={missingReferenceResolution.resolution}
                                        resolutionState={props.resolutionStates?.[index]}
                                        onResolution={(resolution) => {
                                            setResolutions((prev) => {
                                                const newResolutions = [...prev];
                                                newResolutions[index] = {
                                                    ...newResolutions[index],
                                                    resolution,
                                                };
                                                return newResolutions;
                                            });
                                        }}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </>
            )}
        </Box>
    );
};
