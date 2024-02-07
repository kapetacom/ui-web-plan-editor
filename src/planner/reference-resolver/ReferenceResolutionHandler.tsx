/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { KapButton, KapDialog } from '@kapeta/ui-web-components';
import { ActionType, MissingReferenceResolution, ReferenceResolverProps } from './types';
import React, { useEffect, useMemo, useState } from 'react';
import { ReferenceResolver } from './ReferenceResolver';
import { Button, Stack } from '@mui/material';
import {
    PlanResolutionResult,
    PlanResolutionTransformer,
    ResolutionState,
} from '../validation/PlanResolutionTransformer';

interface ReferenceResolverModalProps extends Omit<ReferenceResolverProps, 'onChange'> {
    open: boolean;
    onClose?: () => void;
    onResolved?: (result: PlanResolutionResult) => void | Promise<void>;
    installAsset?: (ref: string) => Promise<void>;
    /**
     *
     * @param ref Asset path to import
     * @returns The new asset ref as a string or null if the import failed
     */
    importAsset?: (ref: string) => Promise<string | null>;
    openExternal?: () => void; //Should open the project in an editor or file explorer
    inline?: boolean;
}

export const ReferenceResolutionHandler = (props: Omit<ReferenceResolverModalProps, 'showError'>) => {
    const [resolutions, setResolutions] = useState<MissingReferenceResolution[]>();
    const [valid, setValid] = useState<boolean>(false);
    const [showErrors, setShowErrors] = useState<boolean>(false);
    const [delaying, setDelaying] = useState<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const [resolutionStates, setResolutionStates] = useState<ResolutionState[]>([]);

    const unresolvable = useMemo(() => {
        return resolutions?.some((r) => r.resolution?.action === ActionType.NONE_AVAILABLE) || false;
    }, [resolutions]);

    const allInstallable = useMemo(() => {
        return resolutions?.every((r) => r.resolution?.action === ActionType.INSTALL) || false;
    }, [resolutions]);

    useEffect(() => {
        if (props.open || props.inline) {
            // Reset state whenever the modal is opened
            setResolutionStates([]);
        }
    }, [props.open, props.inline]);

    const applyButton = !unresolvable ? (
        <KapButton
            variant={'contained'}
            color={'primary'}
            loading={processing || delaying}
            disabled={processing || delaying}
            onClick={async () => {
                if (valid) {
                    const transformer = new PlanResolutionTransformer(
                        {
                            plan: props.plan,
                            blockAssets: props.blockAssets,
                        },
                        resolutions ?? [],
                        {
                            installAsset: props.installAsset,
                            importAsset: props.importAsset,
                        }
                    );
                    setProcessing(true);
                    setResolutionStates(transformer.getResolutionStates());
                    transformer.onStateChange((states) => setResolutionStates(states));
                    try {
                        const result = await transformer.apply();
                        if (result.errors.length < 1) {
                            props.onResolved && (await props.onResolved(result));
                            props.onClose && props.onClose();
                        }
                    } finally {
                        setProcessing(false);
                    }
                } else {
                    setShowErrors(true);
                }
            }}
        >
            {allInstallable ? 'Install now' : 'Apply changes'}
        </KapButton>
    ) : null;

    const mainContent = (
        <ReferenceResolver
            {...props}
            resolutionStates={resolutionStates}
            showErrors={showErrors}
            onDelayingCheck={(delaying) => setDelaying(delaying)}
            onChange={(resolutions, valid) => {
                setResolutions(resolutions);
                setResolutionStates((states) =>
                    // Clear state for resolutions that are no longer present
                    states.filter((s, ix) => resolutions[ix]?.resolution?.action !== ActionType.NONE)
                );
                setValid(valid);
                if (valid && showErrors) {
                    setShowErrors(false);
                }
            }}
        />
    );

    if (props.inline) {
        return (
            <Stack gap={4}>
                {mainContent}
                <Stack justifyContent={'end'} direction={'row'}>
                    {applyButton}
                </Stack>
            </Stack>
        );
    }

    return (
        <KapDialog
            open={props.open}
            onClose={props.onClose}
            maxWidth={false}
            sx={{
                '& .MuiDialog-paper': {
                    maxWidth: '1050px',
                },
            }}
        >
            <KapDialog.Title>Resolve missing references in plan</KapDialog.Title>
            <KapDialog.Content>{mainContent}</KapDialog.Content>
            <KapDialog.Actions>
                {props.onClose && (
                    <Button variant={unresolvable ? 'contained' : 'text'} onClick={props.onClose}>
                        {unresolvable ? 'Close' : 'Cancel'}
                    </Button>
                )}
                {props.openExternal && (
                    <Button variant={'text'} onClick={props.openExternal}>
                        Open Plan
                    </Button>
                )}
                {applyButton}
            </KapDialog.Actions>
        </KapDialog>
    );
};
