/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Alert, Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { ReferenceResolverItem } from './ReferenceResolverItem';
import { ActionType, MissingReferenceResolution, NO_RESOLUTION, ReferenceResolverProps } from './types';
import { isResolutionValid } from './ActionSelector';
import { Waiter } from './Waiter';
import { createSubTitle, ReferenceTile } from './Tiles';
import { ReferenceType } from '../validation/PlanReferenceValidation';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { referenceTypeToKind, referenceTypeToName } from './helpers';
import { ResolutionState } from '../validation/PlanResolutionTransformer';
import { ResolutionStateDisplay } from './ResolutionStateDisplay';

interface Props extends ReferenceResolverProps {
    onDelayingCheck?: (delaying: boolean) => void;
}

function ensureUniqueReferences(missingReferences: MissingReferenceResolution[]): MissingReferenceResolution[] {
    const uniqueRefs: { [key: string]: boolean } = {};
    return missingReferences.filter((ref) => {
        if (uniqueRefs[ref.ref]) {
            return false;
        }
        uniqueRefs[ref.ref] = true;
        return true;
    });
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

    const allInstallable = useMemo(() => {
        return resolutions.every((r) => r.resolution?.action === ActionType.INSTALL);
    }, [resolutions]);

    return (
        <Box
            className={'reference-resolver'}
            sx={{
                minWidth: '900px',
            }}
        >
            {allInstallable && (
                <AllInstallableDisplay resolutions={resolutions} resolutionStates={props.resolutionStates} />
            )}
            {!allInstallable && delayingCheck && <Waiter />}
            {!allInstallable && !delayingCheck && (
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

interface AllInstallableDisplayProps {
    resolutions: MissingReferenceResolution[];
    resolutionStates?: ResolutionState[];
}

const AllInstallableDisplay = (props: AllInstallableDisplayProps) => {
    const uniqueRefs: { [key: string]: boolean } = {};

    return (
        <Box>
            <Alert severity={'info'}>
                This plan is missing some dependencies. Click "Install Now" to install them after which the plan will
                load.
            </Alert>
            <Typography variant={'h6'} sx={{ my: 2 }}>
                Assets that will be installed
            </Typography>
            <Stack gap={1}>
                {props.resolutions.map((resolution, index) => {
                    if (uniqueRefs[resolution.ref]) {
                        // Hide duplicates
                        return null;
                    }
                    uniqueRefs[resolution.ref] = true;
                    const resolutionState = props.resolutionStates?.[index];
                    const refUri = parseKapetaUri(resolution.ref);
                    const kind = referenceTypeToKind(resolution.type);
                    const title = referenceTypeToName(resolution.type);
                    return (
                        <Stack
                            direction={'row'}
                            gap={2}
                            sx={{
                                '& > .tile': {
                                    flex: 1,
                                },
                                '& > .resolution-state': {
                                    width: '240px',
                                },
                            }}
                        >
                            <ReferenceTile key={index} title={title} subtitle={refUri.id} kind={kind} />
                            {resolutionState && <ResolutionStateDisplay resolutionState={resolutionState} />}
                        </Stack>
                    );
                })}
            </Stack>
        </Box>
    );
};
