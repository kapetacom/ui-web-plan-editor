import React from 'react';
import { toClass } from '@kapeta/ui-web-utils';

import './ZoomButtons.less';
import {Box, Fab} from "@mui/material";
import {ZoomIn, ZoomOut, YoutubeSearchedFor} from "@mui/icons-material";
import { grey } from '@mui/material/colors';

interface Props {
    currentZoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

export const ZoomButtons = (props: Props) => {
    const isZoomed = props.currentZoom !== 1;

    return (
        <Box className={'planner-zoom-buttons'}
             sx={{
                 display: 'flex',
                 flexDirection: 'column',
                 gap:2,
                 '.MuiFab-root': {
                     bgcolor: 'white',
                     '&:hover': {
                         bgcolor: grey[200]
                     }
                 },
             }}
        >

            {isZoomed &&
                <Fab size={'small'} onClick={props.onZoomReset}>
                    <YoutubeSearchedFor />
                </Fab>
            }
            <Fab size={'small'} onClick={props.onZoomIn}>
                <ZoomIn />
            </Fab>
            <Fab size={'small'} onClick={props.onZoomOut}>
                <ZoomOut />
            </Fab>
        </Box>
    );
};
