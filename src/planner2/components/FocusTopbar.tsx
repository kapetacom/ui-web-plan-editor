import { action } from 'mobx';
import React from 'react';
import { BlockInstanceSpec } from '@kapeta/ui-web-types';

export function FocusTopbar(props: {
    focusedBlock?: BlockInstanceSpec;
    setFocusBlock: (block: BlockInstanceSpec) => void;
}) {
    return (
        <div>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
            <div
                className="focus-toolbox-back"
                onClick={action(() => {
                    if (props.focusedBlock) {
                        props.setFocusBlock(props.focusedBlock);
                    }
                })}
            >
                <svg width="10" height="10" viewBox="0 0 8 13" fill="none">
                    <path d="M6.5351 11.6896L1.31038 6.46523" stroke="#544B49" strokeLinecap="round" />
                    <path d="M1.31042 6.46518L6.53482 1.34477" stroke="#544B49" strokeLinecap="round" />
                </svg>
            </div>
            <div className="focused-block-info">
                <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.66665 0.681077L0.666664 1.80639V5.82046L0.999933 5.94978V6.66488L0.29936 6.39303C0.119151 6.3231 0 6.14663 0 5.94965V1.67556C0 1.47665 0.121461 1.29888 0.304191 1.23034L3.50671 0.0290499C3.60997 -0.00968335 3.72333 -0.0096833 3.82659 0.02905L7.02911 1.23034C7.21184 1.29888 7.3333 1.47665 7.3333 1.67556V2.70903L6.66664 2.46063V1.80639L3.66665 0.681077Z"
                        fill="#544B49"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.31253 4.45849L5.33335 3.32536L8.35417 4.45849V8.50126L5.33335 9.67346L2.31253 8.50126V4.45849ZM8.69581 3.89687C8.87854 3.96542 9 4.14319 9 4.34209V8.61619C9 8.81316 8.88085 8.98963 8.70064 9.05956L5.49812 10.3023C5.39197 10.3435 5.27473 10.3435 5.16858 10.3023L1.96606 9.05956C1.78585 8.98963 1.6667 8.81316 1.6667 8.61619V4.34209C1.6667 4.14319 1.78816 3.96542 1.97089 3.89687L5.17341 2.69558C5.27667 2.65685 5.39003 2.65685 5.49329 2.69558L8.69581 3.89687Z"
                        fill="#544B49"
                    />
                </svg>
                <p>{props.focusedBlock ? props.focusedBlock.name : ''}</p>
            </div>
        </div>
    );
}
