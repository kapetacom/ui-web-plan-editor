/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Box, Stack, Typography } from '@mui/material';
import React, { forwardRef, useContext, useEffect } from 'react';

import { BlockDefinition, Plan } from '@kapeta/schemas';
import { PlannerMode } from '../utils/enums';
import { PlannerContext, PlannerContextProps, withPlannerContext } from '../planner/PlannerContext';
import { Planner } from '../planner/Planner';
import { AssetInfo } from '../types';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { MissingReference, usePlanValidation } from '../planner/validation/PlanReferenceValidation';
import { Waiter } from '../planner/reference-resolver/Waiter';
import { DEFAULT_MISSING_REFERENCE_DELAY } from '../planner/reference-resolver/types';

interface InnerProps extends PlannerContextProps {
    onMissingReferences?: (references: MissingReference[]) => void;
}

const MissingRefs = ({ delayCheck }: { delayCheck?: number }) => {
    const [delayingCheck, setDelayingCheck] = React.useState(delayCheck && delayCheck > 0);

    useEffect(() => {
        if (!delayCheck) {
            return () => {};
        }
        const timeout = setTimeout(() => setDelayingCheck(false), delayCheck);
        return () => {
            clearTimeout(timeout);
            setDelayingCheck(false);
        };
    }, [delayCheck]);

    if (delayingCheck) {
        return (
            <Waiter
                sx={{
                    color: 'action.disabled',
                }}
            />
        );
    }

    return (
        <Stack alignItems="center" justifyContent="center" height="100%">
            <Stack
                sx={{
                    color: 'action.disabled',
                }}
                direction="row"
                gap={1}
                alignItems="center"
                justifyContent="center"
            >
                <LinkOffIcon />
                <Typography>Missing assets</Typography>
            </Stack>
        </Stack>
    );
};

const PlanPreviewInner = withPlannerContext<InnerProps>(
    forwardRef<HTMLElement, InnerProps>((props, ref) => {
        const { onMissingReferences } = props;

        const planner = useContext(PlannerContext);
        const [hasError, setHasError] = React.useState(false);

        let sxError: any = {};
        if (hasError) {
            sxError = {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            };
        }

        const missingReferences = usePlanValidation(planner.plan, planner.blockAssets);
        useEffect(() => {
            if (onMissingReferences) {
                onMissingReferences(missingReferences);
            }
        }, [onMissingReferences, missingReferences]);

        if (missingReferences.length > 0) {
            return <MissingRefs delayCheck={DEFAULT_MISSING_REFERENCE_DELAY} />;
        }

        return (
            <Box
                ref={ref}
                className="preview"
                sx={{
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    '& > .preview': {
                        pointerEvents: 'none',
                    },
                    '.planner-area-canvas': {
                        bgcolor: 'transparent',
                    },
                    ...sxError,
                }}
            >
                <Planner
                    systemId={props.asset.ref}
                    onError={(error: any) => {
                        setHasError(true);
                        if (props.onMissingReferences && error.missingReferences) {
                            props.onMissingReferences(error.missingReferences);
                        }
                    }}
                    onErrorResolved={() => {
                        setHasError(false);
                        if (props.onMissingReferences) {
                            props.onMissingReferences([]);
                        }
                    }}
                    renderMissingReferences={() => {
                        return <MissingRefs />;
                    }}
                    showZoomPanControls={false}
                    initialZoomPanView={{
                        view: 'center',
                        transitionDuration: 0,
                    }}
                />
            </Box>
        );
    })
);

interface Props {
    asset: AssetInfo<Plan>;
    blocks: AssetInfo<BlockDefinition>[];
    onMissingReferences?: (references: MissingReference[]) => void;
}

export const PlanPreview = (props: Props) => {
    return (
        <PlanPreviewInner
            plan={props.asset.content}
            asset={props.asset}
            blockAssets={props.blocks}
            mode={PlannerMode.VIEW}
            onMissingReferences={props.onMissingReferences}
        />
    );
};
