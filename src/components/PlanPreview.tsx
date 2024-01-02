/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Box, Stack, Typography } from '@mui/material';
import React, { forwardRef, useContext, useEffect } from 'react';

import { BlockDefinition, Plan } from '@kapeta/schemas';
import { Size } from '@kapeta/ui-web-types';
import { PlannerMode } from '../utils/enums';
import { PlannerContext, PlannerContextProps, withPlannerContext } from '../planner/PlannerContext';
import { Planner } from '../planner/Planner';
import { AssetInfo } from '../types';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {
    MissingReference,
    ReferenceValidationError,
    usePlanValidation,
} from '../planner/validation/PlanReferenceValidation';
import { Waiter } from '../planner/reference-resolver/Waiter';
import { DEFAULT_MISSING_REFERENCE_DELAY } from '../planner/reference-resolver/types';

interface InnerProps extends PlannerContextProps {
    width: number;
    height: number;
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
        <Stack alignItems={'center'} justifyContent={'center'} height={'100%'}>
            <Stack
                sx={{
                    color: 'action.disabled',
                }}
                direction={'row'}
                gap={1}
                alignItems={'center'}
                justifyContent={'center'}
            >
                <LinkOffIcon />
                <Typography>Missing assets</Typography>
            </Stack>
        </Stack>
    );
};

const PlanPreviewInner = withPlannerContext<InnerProps>(
    forwardRef<HTMLElement, InnerProps>((props, ref) => {
        const planner = useContext(PlannerContext);
        const [hasError, setHasError] = React.useState(false);
        const size: Size = {
            width: planner.canvasSize.width,
            height: planner.canvasSize.height,
        };

        const widthRatio = props.width / size.width;
        const heightRatio = props.height / size.height;
        const ratio = Math.min(heightRatio, widthRatio);
        const marginH = Math.max(0, props.width - size.width * ratio) / 2;
        const marginV = Math.max(0, props.height - size.height * ratio) / 2;

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
            if (props.onMissingReferences) {
                props.onMissingReferences(missingReferences);
            }
        }, [props.onMissingReferences, missingReferences]);

        if (missingReferences.length > 0) {
            return <MissingRefs delayCheck={DEFAULT_MISSING_REFERENCE_DELAY} />;
        }

        return (
            <Box
                ref={ref}
                sx={{
                    width: props.width,
                    height: props.height,
                    boxSizing: 'border-box',
                    padding: `${marginV}px ${marginH}px`,
                    '& > .preview': {
                        transformOrigin: 'top left',
                        pointerEvents: 'none',
                    },
                    '.planner-area-canvas,.planner-area-scroll': {
                        bgcolor: 'transparent',
                        overflow: 'visible',
                    },
                    '.planner-zoom-buttons': {
                        display: 'none',
                    },
                    ...sxError,
                }}
            >
                <div
                    className={'preview'}
                    style={{
                        width: size.width > 0 ? `${size.width}px` : undefined,
                        height: size.height > 0 ? `${size.height}px` : undefined,
                        transform: `scale(${ratio})`,
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
                </div>
            </Box>
        );
    })
);

interface Props {
    width: number;
    height: number;
    asset: AssetInfo<Plan>;
    blocks: AssetInfo<BlockDefinition>[];
    onMissingReferences?: (references: MissingReference[]) => void;
}

export const PlanPreview = (props: Props) => {
    return (
        <PlanPreviewInner
            width={props.width}
            height={props.height}
            plan={props.asset.content}
            asset={props.asset}
            blockAssets={props.blocks}
            mode={PlannerMode.VIEW}
            onMissingReferences={props.onMissingReferences}
        />
    );
};
