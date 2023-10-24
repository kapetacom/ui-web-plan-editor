import { Alert, Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { ReferenceResolverItem } from './ReferenceResolverItem';
import { MissingReferenceResolution, NO_RESOLUTION, ReferenceResolverProps } from './types';
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

    return (
        <Box
            className={'reference-resolver'}
            sx={{
                minWidth: '900px',
            }}
        >
            <Alert severity={'error'}>The plan has missing references. Please resolve them before continuing.</Alert>
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
