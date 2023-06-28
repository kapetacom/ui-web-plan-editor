import React from 'react';
import './BlockResourceIcon.less';

const actionIcons = {
    plus: (
        <path
            className="action"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.93076 10.5557H4.83552V12.9366H7.21647V14.8414H4.83552V17.2223H2.93076V14.8414H0.549805V12.9366H2.93076V10.5557Z"
        />
    ),
    arrow: <path className="action" d="M6.111 10L1.66656 13.8889L6.111 17.7778V15.5556H9.44434V12.2222H6.111V10Z" />,
    tick: (
        <path
            className="action"
            d="M0.216779 14.6279L3.43003 17.8411L8.6168 12.6545L7.06274 11.1001L3.4497 14.7131L1.78552 13.0594L0.216779 14.6279Z"
        />
    ),
};

const typeIcons = {
    internal: (
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.893 11.9051C12.4476 11.7687 12.9594 11.4889 13.3707 11.0888C13.9705 10.5053 14.3075 9.71401 14.3075 8.88889C14.3075 8.06377 13.9705 7.27245 13.3707 6.689C12.7709 6.10556 11.9574 5.77778 11.1091 5.77778C10.2608 5.77778 9.4473 6.10556 8.84749 6.689C8.4475 7.07808 8.16439 7.5596 8.02016 8.08195C7.4195 7.88459 6.77775 7.77783 6.11106 7.77783C5.48558 7.77783 4.88206 7.8718 4.31383 8.04639C4.31565 8.03095 4.3175 8.01549 4.31937 8L2.3912 6.55111C2.21757 6.41778 2.17188 6.17778 2.28154 5.98222L4.10919 2.90667C4.21885 2.71111 4.46558 2.63111 4.66663 2.71111L6.94205 3.6C7.41724 3.25333 7.9107 2.95111 8.48641 2.72889L8.82453 0.373333C8.86108 0.16 9.05299 0 9.28144 0H12.9367C13.1652 0 13.3571 0.16 13.3937 0.373333L13.7318 2.72889C14.3075 2.95111 14.8009 3.25333 15.2761 3.6L17.5516 2.71111C17.7526 2.63111 17.9993 2.71111 18.109 2.90667L19.9366 5.98222C20.0554 6.17778 20.0006 6.41778 19.827 6.55111L17.8988 8C17.9354 8.30222 17.9628 8.59556 17.9628 8.88889C17.9628 9.18222 17.9354 9.46667 17.8988 9.75111L19.827 11.2267C20.0006 11.36 20.0554 11.6 19.9366 11.7956L18.109 14.8711C17.9993 15.0667 17.7526 15.1378 17.5516 15.0667L15.2761 14.1689C14.8009 14.5244 14.3075 14.8267 13.7318 15.0489L13.3937 17.4044C13.3571 17.6178 13.1652 17.7778 12.9367 17.7778H10.8254C11.6979 16.7212 12.2222 15.3663 12.2222 13.8889C12.2222 13.1945 12.1063 12.5272 11.893 11.9051Z"
            fill="black"
            fillOpacity="0.87"
        />
    ),
    // DB Icon
    operator: (
        <path
            d="M11.317 0C7.07371 0 3.63687 1.71842 3.63687 3.84005C3.63687 5.96168 7.07371 7.6801 11.317 7.6801C15.5602 7.6801 18.9971 5.96168 18.9971 3.84005C18.9971 1.71842 15.5602 0 11.317 0ZM18.9971 5.76008C18.9971 7.8817 15.5602 9.60013 11.317 9.60013C7.07371 9.60013 3.63687 7.8817 3.63687 5.76008V8.71692L4.59688 8.64011C7.08331 8.64011 9.20494 10.2145 10.0114 12.4226L11.317 12.4802C15.5602 12.4802 18.9971 10.7617 18.9971 8.64011V5.76008ZM18.9971 10.5601C18.9971 12.6818 15.5602 14.4002 11.317 14.4002H10.357C10.357 15.4082 10.0978 16.3586 9.63695 17.1842L11.317 17.2802C15.5602 17.2802 18.9971 15.5618 18.9971 13.4402V10.5601Z"
            fill="black"
            fillOpacity="0.87"
        />
    ),
};

export interface BlockResouceIconProps {
    typeIcon: keyof typeof typeIcons;
    actionIcon: keyof typeof actionIcons;
    color?: 'success' | 'error';
    x: number;
    y: number;
}

export const BlockResourceIcon = (props: BlockResouceIconProps) => {
    return (
        <svg width={20} height={20} x={props.x} y={props.y} className={`block-resource-icon ${props.color || ''}`}>
            {typeIcons[props.typeIcon]}
            {actionIcons[props.actionIcon]}
        </svg>
    );
};
