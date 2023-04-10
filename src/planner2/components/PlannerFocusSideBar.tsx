import React from 'react';

import { SidePanel, PanelAlignment, PanelSize, SidePanelHeader } from '@kapeta/ui-web-components';

import { BlockTree } from './BlockTree';

import './PlannerFocusSideBar.less';
import { BlockInstance } from '@kapeta/schemas';


interface Props {
    block?: BlockInstance;
    blurFocus: () => void;
    onClose: () => void;
    onFocusChange: (block: BlockInstance) => void;
}

export const PlannerFocusSideBar = (props: Props) => {
    return (
        <SidePanel
            title="Blocks in view"
            closable={false}
            className="focus-side-panel-2"
            open={!!props.block}
            side={PanelAlignment.right}
            size={PanelSize.small}
            onClose={props.onClose}
            header={
                <SidePanelHeader
                    title="Blocks in use"
                    onIconPress={props.blurFocus}
                    icon={
                        <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                            <path d="M6.05054 11L0.999978 5.94974" stroke="#F5F1EE" strokeLinecap="round" />
                            <path d="M1 5.94971L6.05025 0.999976" stroke="#F5F1EE" strokeLinecap="round" />
                        </svg>
                    }
                />
            }
        >
            {props.block && (
                <BlockTree
                    onBlockClicked={(block) => {
                        props.onFocusChange(block);
                    }}
                    block={props.block}
                />
            )}
        </SidePanel>
    );
};
