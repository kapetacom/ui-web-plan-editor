import React, { useState } from 'react';
import { SVGCornersHelper } from '@kapeta/ui-web-utils';
import './PlannerBlockWarningTag.less';
import { Guid } from 'guid-typescript';

interface PlannerBlockWarningTagProps {
    show: boolean;
    blockName: string;
}

const END_POINTS = [
    { x: 0, y: 0 },
    { x: 0, y: 30 },
    { x: 12, y: 35 },
    { x: 24, y: 30 },
    { x: 24, y: 7 },
];
const INITIAL_POINTS = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 0 },
    { x: 19, y: 7 },
    { x: 20, y: 7 },
];

export const PlannerBlockWarningTag = (props: PlannerBlockWarningTagProps) => {
    const [id] = useState(Guid.create().toString());
    const warningTag = `warning-tag_${id}`;
    const warningTagSign = `warning-tag-sign_${id}`;
    return (
        <svg x="88" y="5" fill="none" filter="url(#banner-shadow)">
            <defs>
                <filter
                    id="banner-shadow"
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                >
                    <feOffset result="offOut" in="SourceAlpha" dx="0" dy="2" />
                    <feGaussianBlur
                        result="blurOut"
                        in="offOut"
                        stdDeviation="2"
                    />
                    <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.4" />
                    </feComponentTransfer>

                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {props.show && (
                <>
                    <path
                        id={warningTag}
                        className="warning-tag"
                        x="20"
                        y="20"
                        d={SVGCornersHelper.createRoundedPathString(
                            INITIAL_POINTS,
                            5
                        )}
                    />
                    <svg
                        id={warningTagSign}
                        y="12"
                        x="4"
                        opacity="1"
                        viewBox="0 0 100 100 "
                        overflow="visible"
                    >
                        <path d="M4.85531 1.30072C5.16776 0.759541 5.94889 0.759542 6.26134 1.30072L11.0067 9.5199C11.3191 10.0611 10.9286 10.7376 10.3037 10.7376H0.812981C0.18808 10.7376 -0.202483 10.0611 0.109968 9.5199L4.85531 1.30072Z" />
                        <path d="M5.00825 7.67637V4.61761H6.09927V7.67637H5.00825ZM6.19019 8.66348C6.19019 8.75007 6.17287 8.83233 6.13824 8.91026C6.10793 8.98386 6.06247 9.0488 6.00186 9.10508C5.94558 9.15704 5.87847 9.19816 5.80054 9.22847C5.72261 9.26311 5.64035 9.28042 5.55376 9.28042C5.46717 9.28042 5.38491 9.26527 5.30698 9.23497C5.23338 9.20466 5.16844 9.16136 5.11216 9.10508C5.05588 9.0488 5.01042 8.98386 4.97578 8.91026C4.94115 8.83666 4.92383 8.75656 4.92383 8.66997C4.92383 8.58771 4.93898 8.50978 4.96929 8.43618C5.00392 8.35825 5.04938 8.29115 5.10566 8.23486C5.16195 8.17858 5.22905 8.13529 5.30698 8.10498C5.38491 8.07034 5.46717 8.05303 5.55376 8.05303C5.64035 8.05303 5.72261 8.07034 5.80054 8.10498C5.87847 8.13529 5.94558 8.17858 6.00186 8.23486C6.06247 8.28682 6.10793 8.35176 6.13824 8.42969C6.17287 8.50329 6.19019 8.58122 6.19019 8.66348Z" />
                    </svg>
                </>
            )}
            <animate
                xlinkHref={`#${warningTag}`}
                attributeName="d"
                from={SVGCornersHelper.createRoundedPathString(
                    INITIAL_POINTS,
                    3
                )}
                dur="0.4s"
                fill="freeze"
                scale="VERTICAL"
                to={SVGCornersHelper.createRoundedPathString(END_POINTS, 2)}
            />
            <animate
                xlinkHref={`#warning-tag-sign_${props.blockName}`}
                attributeName="opacity"
                values="0;1;0;1"
                keyTimes="0;0.3;0.6;1"
                to="0.9"
                dur="2s"
                begin="0.6s"
                repeatCount="1"
                fill="freeze"
            />
        </svg>
    );
};
