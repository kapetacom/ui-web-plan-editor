
import React from "react";
import { ResourceRole } from "@blockware/ui-web-types";
import { ResourceTypeProvider } from "@blockware/ui-web-context";

import {PlannerBlockModelWrapper} from "../../wrappers/PlannerBlockModelWrapper";
import { PlannerModelWrapper } from "../../wrappers/PlannerModelWrapper";
import {PlannerResourceModelWrapper} from "../../wrappers/PlannerResourceModelWrapper";
import { ResourceMode } from "../../wrappers/wrapperHelpers";

export interface BlockTreeProps {
    block:PlannerBlockModelWrapper
    plan:PlannerModelWrapper
    onBlockClicked:(block:PlannerBlockModelWrapper)=>void
    onBlockItemHover:(block?:PlannerBlockModelWrapper)=>void
}

export class BlockTree extends React.Component<BlockTreeProps> {


    private hoveredBlock?:PlannerBlockModelWrapper;

    private getBlockIcon(block:PlannerBlockModelWrapper){
        if(block.id===this.props.block.id){
            return (
                <div className="block-icon">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" >
                    <path d="M0 2.04279C0 1.80029 0.149066 1.58356 0.373327 1.49999L4.30371 0.0354169C4.43043 -0.0118056 4.56957 -0.0118056 4.69629 0.0354168L8.62667 1.49999C8.85093 1.58356 9 1.80029 9 2.04279V6.90671C9 7.14685 8.85377 7.362 8.6326 7.44726L4.70222 8.96234C4.57195 9.01255 4.42805 9.01255 4.29778 8.96234L0.367399 7.44726C0.146232 7.362 0 7.14685 0 6.90671V2.04279Z" fill="#DCD8D3" />
                    <path d="M3.19874 4.03146C2.77535 4.18923 2.5 4.59522 2.5 5.04279V9.90671C2.5 10.35 2.77011 10.7529 3.18756 10.9138L7.11794 12.4289C7.36396 12.5237 7.63604 12.5237 7.88206 12.4289L11.8124 10.9138C12.2299 10.7529 12.5 10.35 12.5 9.90671V5.04279C12.5 4.59522 12.2246 4.18923 11.8013 4.03146L7.87088 2.56689C7.63154 2.4777 7.36846 2.4777 7.12912 2.56689L3.19874 4.03146Z" fill="#DCD8D3" stroke="#544B49" />
                </svg>
                </div>
            )
        }else{
            return(
                <div className="block-icon">
                    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" >
                        <path fillRule="evenodd" clipRule="evenodd" d="M4.48146 1.53616L0.814811 2.91155V7.81763L1.22213 7.97569V8.8497L0.365885 8.51744C0.145629 8.43197 0 8.21628 0 7.97553V2.75164C0 2.50853 0.148452 2.29126 0.371789 2.20748L4.28598 0.739241C4.41218 0.6919 4.55074 0.6919 4.67695 0.739241L8.59113 2.20748C8.81447 2.29126 8.96292 2.50853 8.96292 2.75164V4.01475L8.14811 3.71116V2.91155L4.48146 1.53616Z" fill="#99928F" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M2.82643 6.15294L6.51854 4.768L10.2107 6.15294V11.0941L6.51854 12.5268L2.82643 11.0941V6.15294ZM10.6282 5.46651C10.8515 5.55029 11 5.76757 11 6.01067V11.2346C11 11.4753 10.8544 11.691 10.6341 11.7765L6.71993 13.2953C6.59019 13.3457 6.44689 13.3457 6.31715 13.2953L2.40296 11.7765C2.18271 11.691 2.03708 11.4753 2.03708 11.2346V6.01067C2.03708 5.76757 2.18553 5.55029 2.40887 5.46651L6.32305 3.99827C6.44926 3.95093 6.58782 3.95093 6.71402 3.99827L10.6282 5.46651Z" fill="#99928F" />
                    </svg>
                </div>
            )
        }
    }

    private getResourceIcon(resource:PlannerResourceModelWrapper){
        const resourceConfig = ResourceTypeProvider.get(resource.getKind());
        const type = resourceConfig.type.toString().toLowerCase();
    
        if(resource.role===ResourceRole.CONSUMES){
            return (
                <div className={`resource-icon ${type}`}>
                    <svg 
                        transform="scale(-1, 1)" //mirrors the svg
                        width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.6" d="M6.98571 10.5285C6.80262 10.8195 6.45524 11 6.07824 11L1.03811 11C0.464779 11 -9.17796e-07 10.5896 -8.73537e-07 10.0833L-7.21614e-08 0.916667C-2.79027e-08 0.410406 0.46478 1.20079e-07 1.03811 1.70201e-07L6.07824 6.10823e-07C6.45525 6.43782e-07 6.80262 0.180485 6.98571 0.471495L9.86936 5.05483C10.0435 5.33168 10.0435 5.66832 9.86936 5.94517L6.98571 10.5285Z" fill="#CFCBC1" />
                    </svg>
                </div>
            )
        }else{
            return(
                <div className={`resource-icon ${type}`}>
                    <svg width="10 " height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.6" d="M6.98571 10.5285C6.80262 10.8195 6.45524 11 6.07824 11L1.03811 11C0.464779 11 -9.17796e-07 10.5896 -8.73537e-07 10.0833L-7.21614e-08 0.916667C-2.79027e-08 0.410406 0.46478 1.20079e-07 1.03811 1.70201e-07L6.07824 6.10823e-07C6.45525 6.43782e-07 6.80262 0.180485 6.98571 0.471495L9.86936 5.05483C10.0435 5.33168 10.0435 5.66832 9.86936 5.94517L6.98571 10.5285Z" fill="#CFCBC1" />
                    </svg>
                </div>
            )
        }
    }
    
    private showResourcesFor = (block?:PlannerBlockModelWrapper)=>{
        this.hoveredBlock = block;
    }
  public render() {

      return (
          <div className="connected-blocks">
              <div onClick={() => { this.props.onBlockClicked(this.props.block) }} className="focused-block-line">
                  {this.getBlockIcon(this.props.block)}
                  <div className="block-name">{this.props.block.name} </div>
              </div>
              {this.props.block.getConnectedBlocks().all.map(((block, index) => {
                  return (
                      <div key={block.id + index}
                          className="connected-block-line"
                          onMouseEnter={() => {
                              this.showResourcesFor(block);
                              this.props.onBlockItemHover(block);
                          }}
                          onMouseLeave={() => {
                              this.showResourcesFor(undefined);
                              this.props.onBlockItemHover(undefined);
                          }}
                          onClick={() => { this.props.onBlockClicked(block) }} >
                          {this.getBlockIcon(block)}
                          <div className="block-name">{block.name} </div>
                          {
                              this.hoveredBlock && this.hoveredBlock.id === block.id &&
                              [...block.getResources(ResourceRole.CONSUMES), ...block.getResources(ResourceRole.PROVIDES)].map((resource: PlannerResourceModelWrapper) => {
                                  return (
                                      <div key={resource.id}
                                          onMouseMove={() => { resource.setMode(ResourceMode.SHOW) }}
                                          onMouseLeave={() => { resource.setMode(ResourceMode.HIDDEN) }}>
                                          <div className={"resource-icon"}>{this.getResourceIcon(resource)}</div>
                                          <div className={"resource-name"}>{resource.getData().metadata.name}</div>
                                      </div>
                                  )
                              })
                          }
                      </div>
                  )
              }))}
          </div>
      );
  }
}

