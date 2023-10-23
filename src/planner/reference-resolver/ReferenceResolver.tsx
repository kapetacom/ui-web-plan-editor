import { Alert, Box, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { MissingReference } from '../validation/PlanReferenceValidation';
import { ReferenceResolverItem } from './ReferenceResolverItem';
import { ActionType, MissingReferenceResolution, NO_RESOLUTION, SharedProps } from './types';

interface Props extends SharedProps {
    missingReferences: MissingReference[];
    assetCanBeInstalled: (ref: string) => Promise<boolean>;
    readOnly: boolean;
    onChange: (resolutions: MissingReferenceResolution[], valid: boolean) => void;
    onApply: (resolutions: MissingReferenceResolution[]) => void;
    onCancel?: () => void;
}

export const ReferenceResolver = (props: Props) => {
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
        return resolutions.every((r) => r.resolution?.action && r.resolution?.action !== ActionType.NONE);
    }, [resolutions]);

    useEffect(() => {
        props.onChange(resolutions, valid);
    }, [resolutions, valid]);

    return (
        <Box className={'reference-resolver'}>
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
                                missingReference={missingReferenceResolution}
                                readOnlyPlan={props.readOnly}
                                assetCanBeInstalled={props.assetCanBeInstalled}
                                installAsset={props.installAsset}
                                blockAssets={props.blockAssets}
                                selectAssetFromDisk={props.selectAssetFromDisk}
                                resolution={missingReferenceResolution.resolution}
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

            <Stack direction={'row'} mt={2} gap={2} justifyContent={'end'}>
                <Button disabled={!valid} onClick={props?.onCancel}>
                    Cancel
                </Button>
                <Button
                    disabled={!valid}
                    variant={'contained'}
                    color={'primary'}
                    onClick={() => {
                        props.onApply(resolutions);
                    }}
                >
                    Apply changes
                </Button>
            </Stack>
        </Box>
    );
};
