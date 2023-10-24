import { KapButton, KapDialog } from '@kapeta/ui-web-components';
import { MissingReferenceResolution, ReferenceResolverProps } from './types';
import React, { useEffect, useState } from 'react';
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
    importAsset?: (ref: string) => Promise<void>;
    inline?: boolean;
}

export const ReferenceResolutionHandler = (props: Omit<ReferenceResolverModalProps, 'showError'>) => {
    const [resolutions, setResolutions] = useState<MissingReferenceResolution[]>();
    const [valid, setValid] = useState<boolean>(false);
    const [showErrors, setShowErrors] = useState<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const [resolutionStates, setResolutionStates] = useState<ResolutionState[]>([]);

    useEffect(() => {
        if (props.open || props.inline) {
            // Reset state whenever the modal is opened
            setResolutionStates([]);
        }
    }, [props.open, props.inline]);

    const applyButton = (
        <KapButton
            variant={'contained'}
            color={'primary'}
            loading={processing}
            onClick={async () => {
                if (valid) {
                    const transformer = new PlanResolutionTransformer(
                        {
                            plan: props.plan,
                            blockAssets: props.blockAssets,
                        },
                        resolutions,
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
            Apply changes
        </KapButton>
    );

    const mainContent = (
        <ReferenceResolver
            {...props}
            resolutionStates={resolutionStates}
            showErrors={showErrors}
            onChange={(resolutions, valid) => {
                setResolutions(resolutions);
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
                {props.onClose && <Button onClick={props.onClose}>Cancel</Button>}
                {applyButton}
            </KapDialog.Actions>
        </KapDialog>
    );
};
