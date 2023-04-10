import React from 'react';
import { IResourceTypeProvider } from '@kapeta/ui-web-types';

import { PlannerToolboxPainterProps } from './PlannerToolbox';
import { BlockResource } from '../../components/BlockResource';

export function PlannerToolboxResource(props: PlannerToolboxPainterProps<IResourceTypeProvider>) {
    return (
        <svg width={125} height={35}>
            <BlockResource type={props.item.data.type.toLowerCase()} height={35} width={150} name={props.item.title} />
        </svg>
    );
}
