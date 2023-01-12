import React, {useEffect, useRef} from "react";

import {SidePanel, PanelAlignment, PanelSize, SidePanelHeader} from "@blockware/ui-web-components";

import PlannerBlockModelWrapper from "../wrappers/PlannerBlockModelWrapper";
import {PlannerModelWrapper} from "../wrappers/PlannerModelWrapper";

import BlockTree from "./components/BlockTree";

import "./PlannerFocusSideBar.less";

interface Props {
    plan: PlannerModelWrapper,
    open: boolean
    block?: PlannerBlockModelWrapper
    blurFocus: () => void
    onBlockItemHover: (block?: PlannerBlockModelWrapper) => void
    onClose: () => void
    onFocusChange: (block: PlannerBlockModelWrapper) => void
}


const PlannerFocusSideBar = (props: Props) => {

    const focusPanel = useRef<SidePanel>();

    useEffect(() => {

        if (focusPanel.current) {
            if (props.plan.focusedBlock) {
                focusPanel.current.open()
            } else {
                focusPanel.current.close()
            }
        }
    }, [props.plan.focusedBlock])


    return (
        <SidePanel
            title="Blocks in view"
            closable={false}
            className={"focus-side-panel"}
            ref={focusPanel}
            open={props.open}
            side={PanelAlignment.right}
            size={PanelSize.small}
            onClose={props.onClose}
            header={(<SidePanelHeader title={"Blocks in use"}
                                      onIconPress={props.blurFocus}
                                      icon={(<svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                                          <path d="M6.05054 11L0.999978 5.94974" stroke="#F5F1EE"
                                                strokeLinecap="round"/>
                                          <path d="M1 5.94971L6.05025 0.999976" stroke="#F5F1EE"
                                                strokeLinecap="round"/>
                                      </svg>)
                                      }
            />)}

        >
            {
                props.block &&
                <BlockTree
                    onBlockItemHover={props.onBlockItemHover}
                    onBlockClicked={(block) => {
                        props.onFocusChange(block)
                    }}
                    plan={props.plan}
                    block={props.block}/>
            }
        </SidePanel>
    )
}


export default PlannerFocusSideBar;