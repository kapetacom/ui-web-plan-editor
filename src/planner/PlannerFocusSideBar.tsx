import React, { Component, createRef } from "react";

import {SidePanel, PanelAlignment, PanelSize, SidePanelHeader } from "@blockware/ui-web-components";

import PlannerBlockModelWrapper from "../wrappers/PlannerBlockModelWrapper";
import { PlannerModelWrapper } from "../wrappers/PlannerModelWrapper";

import BlockTree from "./components/BlockTree";

import "./PlannerFocusSideBar.less";

interface PlannerFocusSideBarProps{
    plan:PlannerModelWrapper,
    open:boolean
    block?:PlannerBlockModelWrapper
    blurFocus:()=>void
    onBlockItemHover:(block?:PlannerBlockModelWrapper)=>void
    onClose:()=>void
    onFocusChange:(block:PlannerBlockModelWrapper)=>void
}

export default class PlannerFocusSideBar extends Component<PlannerFocusSideBarProps>{
    
    private focusPanel = createRef<SidePanel>();

    componentDidUpdate() {
        if(this.focusPanel.current){
            if(this.props.plan.focusedBlock){
                this.focusPanel.current.open()
            }else {
                this.focusPanel.current.close()
            }
        }
    } 

    render(){
        return(
            <>
                <SidePanel
                    title="Blocks in view"
                    closable={false}
                    className={"focus-side-panel"}
                    ref={this.focusPanel}
                    open={this.props.open}
                    side={PanelAlignment.right}
                    size={PanelSize.small} 
                    onClose={this.props.onClose}
                    header={(<SidePanelHeader title={"Blocks in use"}
                    onIconPress={this.props.blurFocus}
                    icon={(<svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                                <path d="M6.05054 11L0.999978 5.94974" stroke="#F5F1EE" strokeLinecap="round" />
                                <path d="M1 5.94971L6.05025 0.999976" stroke="#F5F1EE" strokeLinecap="round" />
                            </svg>)
                        }
                    />) }
                
                    >
                    {
                        this.props.block && 
                        <BlockTree
                            onBlockItemHover={this.props.onBlockItemHover}
                            onBlockClicked={(block)=>{this.props.onFocusChange(block)}}
                            plan={this.props.plan}
                        block={this.props.block} />
                    }
            </SidePanel>
            </>
        )
    }
}


