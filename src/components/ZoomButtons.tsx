import React from 'react';
import { toClass } from '@blockware/ui-web-utils';

import './ZoomButtons.less';

interface Props {
    currentZoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

export const ZoomButtons = (props: Props) => {
    const zoomResetClassName = toClass({
        'zoom-reset': true,
        hidden: props.currentZoom === 1,
    });

    return (
        <svg
            className="zoom-buttons"
            x="50"
            y="50"
            overflow="visible"
            height="20"
            width="40"
        >
            <svg
                width="45"
                height="45"
                viewBox="0 0 45 45"
                fill="none"
                onClick={props.onZoomIn}
            >
                <path d="M1.83863 21.2671C0.724626 19.5906 0.724624 17.4095 1.83863 15.7329L10.8088 2.23289C11.7355 0.838211 13.2988 7.04809e-06 14.9733 6.97489e-06L30.0267 6.31688e-06C31.7012 6.24369e-06 33.2645 0.83821 34.1912 2.23288L43.1614 15.7329C44.2754 17.4094 44.2754 19.5906 43.1614 21.2671L34.1912 34.7671C33.2645 36.1618 31.7012 37 30.0267 37L14.9733 37C13.2988 37 11.7355 36.1618 10.8088 34.7671L1.83863 21.2671Z" />
                <foreignObject x={0} y={0} width={45} height={45}>
                    <i className={'fa fa-search-plus'} />
                </foreignObject>
            </svg>
            <svg
                width="45"
                height="45"
                viewBox="0 0 45 45"
                x="36"
                y="20"
                fill="none"
                onClick={props.onZoomOut}
            >
                <path d="M1.83863 21.2671C0.724626 19.5906 0.724624 17.4095 1.83863 15.7329L10.8088 2.23289C11.7355 0.838211 13.2988 7.04809e-06 14.9733 6.97489e-06L30.0267 6.31688e-06C31.7012 6.24369e-06 33.2645 0.83821 34.1912 2.23288L43.1614 15.7329C44.2754 17.4094 44.2754 19.5906 43.1614 21.2671L34.1912 34.7671C33.2645 36.1618 31.7012 37 30.0267 37L14.9733 37C13.2988 37 11.7355 36.1618 10.8088 34.7671L1.83863 21.2671Z" />

                <foreignObject x={0} y={0} width={45} height={45}>
                    <i className={'fa fa-search-minus'} />
                </foreignObject>
            </svg>

            <svg
                className={zoomResetClassName}
                width="45"
                height="45"
                viewBox="0 0 45 45"
                x="35"
                y="-20"
                fill="none"
                onClick={props.onZoomReset}
            >
                <g>
                    <path d="M1.83863 21.2671C0.724626 19.5906 0.724624 17.4095 1.83863 15.7329L10.8088 2.23289C11.7355 0.838211 13.2988 7.04809e-06 14.9733 6.97489e-06L30.0267 6.31688e-06C31.7012 6.24369e-06 33.2645 0.83821 34.1912 2.23288L43.1614 15.7329C44.2754 17.4094 44.2754 19.5906 43.1614 21.2671L34.1912 34.7671C33.2645 36.1618 31.7012 37 30.0267 37L14.9733 37C13.2988 37 11.7355 36.1618 10.8088 34.7671L1.83863 21.2671Z" />
                    <foreignObject x={0} y={0} width={45} height={45}>
                        <i className={'fa fa-undo'} />
                    </foreignObject>
                </g>
            </svg>
        </svg>
    );
};
