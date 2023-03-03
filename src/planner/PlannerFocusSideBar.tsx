import React, { useEffect, useRef } from 'react';

import {
    SidePanel,
    PanelAlignment,
    PanelSize,
    SidePanelHeader,
} from '@blockware/ui-web-components';

import { PlannerBlockModelWrapper } from '../wrappers/PlannerBlockModelWrapper';
import { PlannerModelWrapper } from '../wrappers/PlannerModelWrapper';

import { BlockTree } from './components/BlockTree';

import './PlannerFocusSideBar.less';
import { observer } from 'mobx-react';
import { runInAction } from 'mobx';

interface Props {
    plan: PlannerModelWrapper;
    block?: PlannerBlockModelWrapper;
    blurFocus: () => void;
    onBlockItemHover: (block?: PlannerBlockModelWrapper) => void;
    onClose: () => void;
    onFocusChange: (block: PlannerBlockModelWrapper) => void;
}

export const PlannerFocusSideBar = observer((props: Props) => {
    return (
        <SidePanel
            title="Blocks in view"
            closable={false}
            className="focus-side-panel"
            open={!!props.block}
            side={PanelAlignment.right}
            size={PanelSize.small}
            onClose={props.onClose}
            header={
                <SidePanelHeader
                    title="Blocks in use"
                    onIconPress={props.blurFocus}
                    icon={
                        <svg
                            width="7"
                            height="12"
                            viewBox="0 0 7 12"
                            fill="none"
                        >
                            <path
                                d="M6.05054 11L0.999978 5.94974"
                                stroke="#F5F1EE"
                                strokeLinecap="round"
                            />
                            <path
                                d="M1 5.94971L6.05025 0.999976"
                                stroke="#F5F1EE"
                                strokeLinecap="round"
                            />
                        </svg>
                    }
                />
            }
        >
            {props.block && (
                <BlockTree
                    key={props.plan.focusedBlock?.id}
                    onBlockItemHover={props.onBlockItemHover}
                    onBlockClicked={(block) => {
                        props.onFocusChange(block);
                    }}
                    plan={props.plan}
                    block={props.block}
                />
            )}
        </SidePanel>
    );
});
