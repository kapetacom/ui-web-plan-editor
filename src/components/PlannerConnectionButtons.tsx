import React from 'react';

import { toClass } from '@blockware/ui-web-utils';
import { ButtonStyle } from '@blockware/ui-web-components';
import { ResourceTypeProvider } from '@blockware/ui-web-context';

import './PlannerConnectionButtons.less';
import { PlannerConnectionModelWrapper } from '../wrappers/PlannerConnectionModelWrapper';
import { observer } from 'mobx-react';
import { SVGCircleButton } from './SVGCircleButton';

function makeButtonBg(
    x: number,
    y: number,
    height: number,
    lineLength: number
) {
    const size = 18;

    if (height > 0) {
        // eslint-disable-next-line no-param-reassign
        height += 5; // More padding
    }

    return `M ${x},${y}
            q 0,${height} ${size},${height}
            l ${lineLength},0
            q ${size},0 ${size},-${height}
            q 0,-${height} ${-size},-${height}
            l -${lineLength},0
            q -${size},0 -${size},${height}
            m ${(lineLength + size * 2).toFixed()},0`;
}

let ID_IX = 1;

interface PlannerConnectionButtonsProps {
    connection: PlannerConnectionModelWrapper;
    open: boolean;
    x: number;
    y: number;
    readOnly?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onInspect: () => void;
}

interface PlannerConnectionButtonsPropsState {
    over: boolean;
}

@observer
export class PlannerConnectionButtons extends React.Component<
    PlannerConnectionButtonsProps,
    PlannerConnectionButtonsPropsState
> {
    private ix: number = ID_IX++;

    constructor(props: any) {
        super(props);

        this.state = {
            over: false,
        };
    }

    onMouseOver = () => {
        this.setState({ over: true });
    };

    onMouseOut = () => {
        this.setState({ over: false });
    };

    render() {
        let inspectX = -25;
        const editX = 5;
        let deleteX = 35;
        const clipHeight = 12;
        const buttonHeight = 12;
        let length = this.state.over ? 60 : 0;
        let x = this.state.over ? -30 : 0;

        const clipId = `planner_connection_buttons_${this.ix}`;

        let hasMapping = true;
        let hasInspector = true;

        const converter = ResourceTypeProvider.getConverterFor(
            this.props.connection.fromResource.getKind(),
            this.props.connection.toResource.getKind()
        );

        if (!converter || !converter.mappingComponentType) {
            hasMapping = false;
        }

        if (!converter || !converter.inspectComponentType) {
            hasInspector = false;
        }

        if (!hasMapping) {
            inspectX -= 30;
            deleteX -= 30;
            if (this.state.over) {
                length -= 30;
                x += 15;
            }
        }

        const readOnly =
            this.props.connection.fromResource.block.plan.isReadOnly();
        const showEditBtn =
            !readOnly && (!this.props.connection.isValid() || hasMapping);
        let showDelete = !readOnly;
        let showInspect = hasInspector;

        if (!showDelete) {
            if (this.state.over) {
                length -= 30;
                x += 15;
            }
        }

        if (!showEditBtn) {
            inspectX += 30;
            if (this.state.over) {
                length -= 30;
                x += 15;
            }
        }

        if (!showEditBtn && !showInspect && showDelete) {
            deleteX = 5;
        }

        const bgPath = makeButtonBg(
            x,
            0,
            this.props.open ? clipHeight + 2 : 0,
            length
        );
        const bgPathClip = makeButtonBg(
            x,
            0,
            this.props.open ? clipHeight : 0,
            length
        );

        if (!showDelete && !showEditBtn && !showInspect) {
            return <></>;
        }

        if (!this.state.over) {
            if (showInspect || showEditBtn) {
                showDelete = false;
            }
            if (showEditBtn) {
                showInspect = false;
            }
        }

        return (
            <g className="buttons">
                <g
                    className={toClass({
                        'planner-connection-buttons': true,
                        over: this.state.over,
                        open:
                            this.props.open || !this.props.connection.isValid(),
                        'no-inspect': !hasInspector,
                        'no-mapping': !hasMapping,
                    })}
                    transform={`translate(${this.props.x},${this.props.y})`}
                    onMouseOver={this.onMouseOver}
                    onMouseOut={this.onMouseOut}
                >
                    <path className="border" d={bgPath} />

                    <clipPath id={clipId}>
                        <path className="background" d={bgPathClip} />
                    </clipPath>

                    <svg clipPath={`url(#${clipId})`}>
                        {showEditBtn && !this.props.connection.isValid() && (
                            <SVGCircleButton
                                x={editX}
                                y={-buttonHeight}
                                className="warning"
                                style={ButtonStyle.DEFAULT}
                                icon="fa fa-exclamation-triangle"
                                onClick={this.props.onEdit}
                            />
                        )}
                        {showEditBtn && this.props.connection.isValid() && (
                            <SVGCircleButton
                                x={editX}
                                y={-buttonHeight}
                                className="edit"
                                style={ButtonStyle.SECONDARY}
                                icon="fa fa-pencil"
                                onClick={this.props.onEdit}
                            />
                        )}

                        {showInspect && (
                            <SVGCircleButton
                                x={inspectX}
                                y={-buttonHeight}
                                className="inspect"
                                style={ButtonStyle.PRIMARY}
                                icon="fa fa-search"
                                onClick={this.props.onInspect}
                            />
                        )}
                        {showDelete && (
                            <SVGCircleButton
                                x={deleteX}
                                y={-buttonHeight}
                                className="delete"
                                style={ButtonStyle.DANGER}
                                icon="fa fa-trash"
                                onClick={this.props.onDelete}
                            />
                        )}
                    </svg>
                </g>
            </g>
        );
    }
}
