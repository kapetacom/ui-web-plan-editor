/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { PlannerResourcesList } from '../src/panels/tools/PlannerResourcesList';

import { Tab, Tabs } from '@mui/material';
import { PlannerDrawer } from '../src/panels/PlannerDrawer';
import { PublicUrlList } from '../src/panels/tools/PublicUrlList';

import './styles.less';

export default {
    title: 'Resource Drawer',
    parameters: {
        layout: 'fullscreen',
    },
};

export const Empty = () => {
    return (
        <div style={{ backgroundColor: 'gray' }}>
            <PlannerDrawer>
                <PlannerResourcesList />
            </PlannerDrawer>
        </div>
    );
};

export const DrawerTabs = () => {
    const [currentTab, setCurrentTab] = React.useState(0);
    return (
        // Height 100% to be able to resize the drawer in storybook to test overflow
        <div style={{ backgroundColor: 'gray', height: '100%' }}>
            <PlannerDrawer>
                <Tabs value={currentTab} onChange={(_evt, value) => setCurrentTab(value)}>
                    <Tab value={0} label="Resources" />
                    <Tab value={1} label="Public URLs" />
                </Tabs>
                {currentTab === 0 ? (
                    <PlannerResourcesList
                        onShowMoreAssets={() => {
                            console.log('show more assets');
                        }}
                    />
                ) : null}
                {currentTab === 1 ? (
                    <PublicUrlList
                        onConfigureGateway={() => {
                            console.log('configured!');
                        }}
                    />
                ) : null}
            </PlannerDrawer>
        </div>
    );
};
