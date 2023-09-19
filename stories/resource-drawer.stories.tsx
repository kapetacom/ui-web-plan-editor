import React from 'react';
import { PlannerResourceDrawer } from '../src/panels/PlannerResourceDrawer';

import './styles.less';
import { createTheme, ThemeProvider } from '@mui/material';
import { darkTheme } from '@kapeta/style';

export default {
    title: 'Resource Drawer',
    parameters: {
        layout: 'fullscreen',
    },
};

export const Empty = () => {
    return (
        <ThemeProvider theme={createTheme(darkTheme)}>
            <div style={{ backgroundColor: 'gray' }}>
                <PlannerResourceDrawer />
            </div>
        </ThemeProvider>
    );
};

export const MockData = () => {
    return (
        <ThemeProvider theme={createTheme(darkTheme)}>
            <div style={{ backgroundColor: 'gray' }}>
                <PlannerResourceDrawer
                    onShowMoreAssets={() => {
                        console.log('show more assets');
                    }}
                />
            </div>
        </ThemeProvider>
    );
};
