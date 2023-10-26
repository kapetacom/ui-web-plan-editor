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

interface InnerProps extends PlannerContextProps {
    width: number;
    height: number;
    onMissingReferences?: (references: MissingReference[]) => void;
}

const MissingRefs = () => {
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
            return <MissingRefs />;
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
