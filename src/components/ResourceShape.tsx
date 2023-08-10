import React, { MouseEventHandler } from 'react';

import { IResourceTypeProvider, Point, ResourceProviderType, ResourceRole } from '@kapeta/ui-web-types';
import { Box, useTheme } from '@mui/material';

import { Add } from '@mui/icons-material';
import { AssetKindIcon } from '@kapeta/ui-web-components';
import { useDraggedRotation } from '../planner/utils/dndUtils';

const OperatorResourceBG = (
    <svg width="114" height="48" viewBox="0 0 114 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            className="background"
            d="M7.12892e-05 44.2784C3.19175e-05 46.3337 1.66619 47.9999 3.72151 47.9999L114 48L114 8.83834e-05L3.7219 6.06826e-05C1.66661 6.08773e-05 0.000459945 1.66621 0.000459926 3.7215L0.000459742 24L7.12892e-05 44.2784Z"
        />
        <path
            className="stroke"
            d="M0.500071 44.2784C0.500037 46.0576 1.94234 47.4999 3.72151 47.4999L113.5 47.5L113.5 0.500088L3.7219 0.500061C1.94275 0.500061 0.50046 1.94235 0.50046 3.7215L0.50046 24L0.500071 44.2784Z"
        />
    </svg>
);

const ConsumerResourceBG = (
    <svg width="114" height="48" viewBox="0 0 114 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            className="background"
            d="M10.535 45.8922C11.155 47.1807 12.4585 47.9999 13.8883 47.9999L114 48L114 -1.07988e-05L13.8883 -1.27597e-05C12.4584 -1.26242e-05 11.155 0.819255 10.535 2.10772L0.776548 22.3862C0.285782 23.4061 0.285781 24.5938 0.776546 25.6136L10.535 45.8922Z"
        />
        <path
            className="stroke"
            d="M10.9855 45.6754C11.5223 46.7907 12.6506 47.4999 13.8883 47.4999L113.5 47.5L113.5 0.499989L13.8883 0.499987C12.6506 0.499987 11.5223 1.20918 10.9855 2.32453L1.22709 22.603C0.802267 23.4859 0.802265 24.514 1.22709 25.3968L10.9855 45.6754Z"
        />
    </svg>
);

const ProviderResourceBG = (
    <svg width="114" height="48" viewBox="0 0 114 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            className="background"
            d="M103.465 45.8922C102.845 47.1807 101.542 47.9999 100.112 47.9999L0 48L-1.1386e-05 -1.07988e-05L100.112 -1.27597e-05C101.542 -1.26242e-05 102.845 0.819255 103.465 2.10772L113.223 22.3862C113.714 23.4061 113.714 24.5938 113.223 25.6136L103.465 45.8922Z"
        />
        <path
            className="stroke"
            d="M103.014 45.6754C102.478 46.7907 101.349 47.4999 100.112 47.4999L0.5 47.5L0.499989 0.499989L100.112 0.499987C101.349 0.499987 102.478 1.20918 103.014 2.32453L112.773 22.603C113.198 23.4859 113.198 24.514 112.773 25.3968L103.014 45.6754Z"
        />
    </svg>
);

const TYPE_NAMES = {
    [ResourceProviderType.OPERATOR]: 'Operator',
    [ResourceProviderType.EXTENSION]: 'Extension',
    [ResourceProviderType.INTERNAL]: 'Service',
};

interface Props {
    resource: IResourceTypeProvider;
    dragging?: boolean;
    position?: Point | null;
    dragged?: Point | null;
    onMouseDown?: MouseEventHandler<HTMLDivElement> | undefined;
}

export const ResourceShape = (props: Props) => {
    const theme = useTheme();

    let infoOffset = 3;

    let bg = ConsumerResourceBG;
    if (props.resource.role === ResourceRole.PROVIDES) {
        bg = ProviderResourceBG;
        infoOffset = 0;
    }
    if (props.resource.type === ResourceProviderType.OPERATOR) {
        bg = OperatorResourceBG;
    }

    const rotation = useDraggedRotation(props.dragged?.x);

    return (
        <Box
            onMouseDown={props.onMouseDown}
            style={{
                left: props.position?.x,
                top: props.position?.y,
            }}
            sx={{
                userSelect: 'none',
                transform: props.dragging ? `translate(-50%, -50%)` : undefined,
                position: props.dragging ? 'fixed' : 'relative',
                cursor: props.dragging ? 'grabbing' : 'grab',
                zIndex: props.dragging ? 50 : undefined,
                width: '114px',
                height: '48px',
                '& > .container': {
                    transition: 'all 100ms ease-in-out',
                    '& > .info': {
                        position: 'relative',
                        zIndex: 2,
                        gap: 1,
                        p: 1,
                        display: 'flex',
                        flexDirection: props.resource.role === ResourceRole.PROVIDES ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        '.icon': {
                            flex: 0,
                            alignSelf: 'center',
                            width: '20px',
                            height: '20px',
                            pr: '2px',
                            pl: '2px',
                            position: 'relative',
                            'svg:not(.plus),img,i': {
                                width: '20px',
                                height: '20px',
                                fontSize: '20px',
                            },
                            '& > .plus': {
                                transition: 'background-color 200ms ease-in-out',
                                bgcolor: 'white',
                                borderRadius: '12px',
                                position: 'absolute',
                                width: '12px',
                                height: '12px',
                                left: props.resource.role === ResourceRole.PROVIDES ? undefined : -2,
                                bottom: -2,
                                right: props.resource.role === ResourceRole.PROVIDES ? -2 : undefined,
                                zIndex: 2,
                                lineHeight: 0,
                                '& > svg': {
                                    width: '12px',
                                    height: '12px',
                                    color: 'primary.main',
                                },
                            },
                        },
                        '.text': {
                            flex: 1,
                            width: '74px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            '.title': {
                                fontSize: '12px',
                                fontWeight: 700,
                            },
                            '.type': {
                                fontSize: '10px',
                                textTransform: 'capitalize',
                            },
                        },
                    },
                    '& > svg': {
                        position: 'absolute',
                        transition: 'all 200ms ease-in-out',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        '.background': {
                            transition: 'all 200ms ease-in-out',
                            fill: 'white',
                        },
                        '.stroke': {
                            transition: 'all 200ms ease-in-out',
                            stroke: 'black',
                            strokeOpacity: 0.23,
                        },
                    },
                },
                '&:hover': {
                    '& > .container > svg': {
                        '.stroke': {
                            stroke: theme.palette.primary.main,
                            strokeOpacity: 1,
                        },
                        filter: 'drop-shadow(0px 0px 5px rgb(0 0 0 / 0.2))',
                    },
                },
            }}
        >
            <div
                className={'container'}
                style={{
                    transform: props.dragging ? `rotate(${rotation}deg)` : undefined,
                }}
            >
                <div className={'info'}>
                    <div className={'icon'}>
                        <div className={'plus'}>
                            <Add />
                        </div>
                        <AssetKindIcon size={20} asset={props.resource.definition} />
                    </div>
                    <div className={'text'}>
                        <div className={'title'}>{props.resource.title}</div>
                        <div className={'type'}>{TYPE_NAMES[props.resource.type]}</div>
                    </div>
                </div>
                {bg}
            </div>
        </Box>
    );
};
