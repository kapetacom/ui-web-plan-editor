import { FormControl, FormHelperText, IconButton, MenuItem, Select, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';
import { AssetVersionSelectorEntry } from '@kapeta/ui-web-components';
import { ActionType, NO_RESOLUTION, Resolution } from './types';
import { ActionFormInner } from './ActionFormInner';

interface ActionSelectorProps {
    availableActions: ActionType[];
    resolution: Resolution;
    onResolution: (resolution: Resolution) => void;
    alternativeVersions: AssetVersionSelectorEntry[];
    alternativeTypes: AssetVersionSelectorEntry[];
    selectAssetFromDisk?: () => Promise<string | undefined>;
    showErrors?: boolean;
}

const ActionsWithForm = [
    ActionType.SELECT_ALTERNATIVE_TYPE,
    ActionType.SELECT_ALTERNATIVE_VERSION,
    ActionType.SELECT_LOCAL_VERSION,
];

export function isResolutionValid(resolution?: Resolution): boolean {
    if (!resolution?.action) {
        return false;
    }

    if (resolution?.action === ActionType.NONE) {
        return false;
    }

    if (ActionsWithForm.includes(resolution.action)) {
        return !!resolution.value;
    }

    return true;
}

function toActionName(action: ActionType): string {
    switch (action) {
        case ActionType.INSTALL:
            return 'Install from BlockHub';
        case ActionType.SELECT_LOCAL_VERSION:
            return 'Select local folder';
        case ActionType.SELECT_ALTERNATIVE_VERSION:
            return 'Select alternative version';
        case ActionType.SELECT_ALTERNATIVE_TYPE:
            return 'Select alternative type';
        case ActionType.REMOVE_BLOCK:
            return 'Remove block from plan';
    }
}

export const ActionSelector = (props: ActionSelectorProps) => {
    if (props.availableActions.length === 0) {
        return <span>There are no known solutions to fix this missing reference.</span>;
    }

    const actionHasValue = ActionsWithForm.includes(props.resolution.action);

    if (actionHasValue) {
        return (
            <Stack
                direction={'row'}
                gap={2}
                alignItems={'center'}
                justifyContent={'stretch'}
                sx={{
                    '.MuiFormControl-root': {
                        my: 0,
                    },
                    '.MuiFormControl-root > .MuiFormGroup-root > .MuiStack-root': {
                        mt: 0,
                        pt: 0,
                    },
                    '& > .form-container': {
                        flexGrow: 1,
                        maxWidth: '450px',
                    },
                }}
            >
                <ActionFormInner {...props} />
                <IconButton
                    onClick={() => {
                        props.onResolution(NO_RESOLUTION);
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Stack>
        );
    }

    const currentAction = props.resolution.action ?? ActionType.NONE;
    const hasError =
        (props.showErrors && currentAction === ActionType.NONE) || (actionHasValue && !props.resolution.value);

    return (
        <FormControl error={hasError}>
            <Select
                sx={{
                    width: '240px',
                }}
                value={props.resolution.action ?? ActionType.NONE}
                onChange={(evt) => {
                    props.onResolution({
                        action: evt.target.value as ActionType,
                        value: undefined,
                    });
                }}
            >
                <MenuItem value={ActionType.NONE}>Select action...</MenuItem>
                {props.availableActions.map((action, ix) => {
                    return (
                        <MenuItem key={ix} value={action}>
                            {toActionName(action)}
                        </MenuItem>
                    );
                })}
            </Select>
            {hasError && (
                <FormHelperText>
                    {actionHasValue && !props.resolution.value ? 'Missing value' : 'Missing action'}
                </FormHelperText>
            )}
        </FormControl>
    );
};
