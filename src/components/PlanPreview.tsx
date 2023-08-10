import {Box} from '@mui/material';
import React, {forwardRef, useContext} from 'react';


import {BlockDefinition, Plan} from '@kapeta/schemas';
import {Asset, Size} from '@kapeta/ui-web-types';
import {PlannerMode} from "../utils/enums";
import {PlannerContext, PlannerContextProps, withPlannerContext} from '../planner/PlannerContext';
import { Planner } from '../planner/Planner';

interface InnerProps extends PlannerContextProps {
    width: number;
    height: number;
}

const PlanPreviewInner = withPlannerContext<InnerProps>(forwardRef<HTMLDivElement, InnerProps>((props, ref) => {
    const planner = useContext(PlannerContext);
    const size: Size = {
        width: planner.canvasSize.width,
        height: planner.canvasSize.height,
    };

    const widthRatio = props.width / size.width;
    const heightRatio = props.height / size.height;
    const ratio = Math.min(heightRatio, widthRatio);
    const marginH = Math.max(0, (props.width - (size.width * ratio))) / 2;
    const marginV = Math.max(0, (props.height - (size.height * ratio))) / 2;

    return <Box ref={ref}
                sx={{
                    width: props.width,
                    height: props.height,
                    boxSizing: 'border-box',
                    padding: `${marginV}px ${marginH}px`,
                    '& > .preview': {
                        transformOrigin: 'top left',
                        pointerEvents: 'none'
                    },
                    '.planner-area-canvas,.planner-area-scroll': {
                        bgcolor: 'transparent',
                        overflow: 'visible'
                    },
                    '.planner-zoom-buttons': {
                        display: 'none'
                    }
                }}>

        <div className={'preview'}
             style={{
                 width: `${size.width}px`,
                 height: `${size.height}px`,
                 transform: `scale(${ratio})`
             }}>
            <Planner systemId={props.asset.ref} />
        </div>
    </Box>
}));

interface Props {
    width: number;
    height: number;
    asset: Asset<Plan>;
    blocks: Asset<BlockDefinition>[];
}

export const PlanPreview = (props: Props) => {

    return <PlanPreviewInner width={props.width}
                             height={props.height}
                             plan={props.asset.data}
                             asset={props.asset}
                             blockAssets={props.blocks}
                             mode={PlannerMode.VIEW}/>
}

