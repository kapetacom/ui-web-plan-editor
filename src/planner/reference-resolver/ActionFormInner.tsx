import { AssetVersionSelector, AssetVersionSelectorEntry, FormContainer } from '@kapeta/ui-web-components';
import React, { useEffect, useMemo } from 'react';
import { Box, Button, FormHelperText } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { ActionType, NO_RESOLUTION, Resolution } from './types';
import { shortenPathName } from './helpers';

interface ActionFormInnerProps {
    resolution: Resolution;
    alternativeVersions: AssetVersionSelectorEntry[];
    alternativeTypes: AssetVersionSelectorEntry[];
    onResolution: (resolution: Resolution) => void;
    selectAssetFromDisk?: () => Promise<string | undefined>;
    showErrors?: boolean;
}

export const ActionFormInner = (props: ActionFormInnerProps) => {
    const initialData = useMemo(() => {
        switch (props.resolution.action) {
            case ActionType.SELECT_ALTERNATIVE_TYPE:
                return {
                    value: props.alternativeTypes[0]?.ref,
                };
            case ActionType.SELECT_ALTERNATIVE_VERSION:
                return {
                    value: props.alternativeVersions[0]?.ref,
                };
            case ActionType.SELECT_LOCAL_VERSION:
                return {
                    value: undefined,
                };
        }
    }, [props.resolution.action]);

    useEffect(() => {
        if (initialData.value) {
            props.onResolution({
                action: props.resolution.action,
                value: initialData.value,
            });
        }
    }, [props.resolution.action, initialData.value]);

    const onChange = (data: any) => {
        if (data.value) {
            props.onResolution({
                action: props.resolution.action,
                value: data.value,
            });
        }
    };

    const hasError = props.showErrors && !props.resolution.value;

    switch (props.resolution.action) {
        case ActionType.SELECT_ALTERNATIVE_TYPE:
            return (
                <FormContainer initialValue={initialData} onChange={onChange}>
                    <AssetVersionSelector name="value" assetTypes={props.alternativeTypes} />
                </FormContainer>
            );
        case ActionType.SELECT_ALTERNATIVE_VERSION:
            return (
                <FormContainer initialValue={initialData} onChange={onChange}>
                    <AssetVersionSelector name="value" assetTypes={props.alternativeVersions} />
                </FormContainer>
            );
        case ActionType.SELECT_LOCAL_VERSION:
            return (
                <Box>
                    <Button
                        size={'large'}
                        onClick={async () => {
                            try {
                                const ymlFile = await props.selectAssetFromDisk();

                                if (ymlFile) {
                                    props.onResolution({
                                        action: props.resolution.action,
                                        value: ymlFile,
                                    });
                                } else {
                                    props.onResolution(NO_RESOLUTION);
                                }
                            } catch (e) {
                                // Ignore
                            }
                        }}
                        variant={'text'}
                        color={hasError ? 'error' : 'primary'}
                        startIcon={<FolderOpenIcon />}
                    >
                        {props.resolution.value ? shortenPathName(props.resolution.value) : 'Select Asset'}
                    </Button>
                    {hasError && (
                        <FormHelperText
                            sx={{
                                ml: '14px',
                                color: 'error.main',
                            }}
                        >
                            Missing value
                        </FormHelperText>
                    )}
                </Box>
            );
    }
};
