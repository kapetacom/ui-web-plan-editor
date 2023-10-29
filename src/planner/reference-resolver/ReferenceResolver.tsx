/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Alert, Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { ReferenceResolverItem } from './ReferenceResolverItem';
import { ActionType, MissingReferenceResolution, NO_RESOLUTION, ReferenceResolverProps } from './types';
import { isResolutionValid } from './ActionSelector';

export const ReferenceResolver = (props: ReferenceResolverProps) => {
    const [resolutions, setResolutions] = useState<MissingReferenceResolution[]>([
        ...props.missingReferences.map((mf) => {
            return {
                ...mf,
                resolution: NO_RESOLUTION,
            };
        }),
    ]);

    useEffect(() => {
        setResolutions((prevState) => {
            return props.missingReferences.map((ref, ix) => {
                return {
                    ...ref,
                    resolution: prevState[ix]?.resolution ?? NO_RESOLUTION,
                };
            });
        });
    }, [props.missingReferences]);

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
        </Box>
    );
};
