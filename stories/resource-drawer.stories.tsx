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

export const MockData = () => {
    const [currentTab, setCurrentTab] = React.useState(0);
    return (
        <div style={{ backgroundColor: 'gray' }}>
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
