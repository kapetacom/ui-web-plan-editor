import { BlockDefinition, Plan } from '@kapeta/schemas';
import { AssetInfo, PlannerNodeSize } from '../types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { calculateBlockSize } from './BlockContext';
import { BlockMode } from '../utils/enums';
import { BlockTypeProvider } from '@kapeta/ui-web-context';
import { BLOCK_SIZE } from './utils/planUtils';

const DEFAULT_LAYOUT_MARGIN_X = 500;
const DEFAULT_LAYOUT_MARGIN_Y = 100;
const NODE_WIDTH = BLOCK_SIZE;
const NODE_HEIGHT = BLOCK_SIZE;
const CANVAS_OFFSET_LEFT = 250;
const CANVAS_OFFSET_TOP = 0;

interface LayoutOptions {
    nodeSize: PlannerNodeSize;
    nodeWidth: number;
    marginX: number;
    marginY: number;
}

function toEdgeId(providerId: string, consumerId: string) {
    return [providerId, consumerId].sort().join('-');
}

export function applyAutoLayout(
    plan: Plan,
    blocks: AssetInfo<BlockDefinition>[],
    options?: Partial<LayoutOptions>
): Plan {
    const opts = toOptions(options);

    const graph = new GraphHandler(plan, blocks);

    graph.blocks().forEach((block) => {
        block.dimensions.top = 0;
        block.dimensions.left = 0;
    });

    const nodes = graph.blockIds();

    function countEdges(nodeId: string) {
        return countInEdges(nodeId) + countOutEdges(nodeId);
    }

    function countInEdges(nodeId: string) {
        const edges = graph.inEdges(nodeId);
        return edges ? edges.length : 0;
    }

    function countOutEdges(nodeId: string) {
        const edges = graph.outEdges(nodeId);
        return edges ? edges.length : 0;
    }

    let minInEdges = 100;
    nodes.forEach((nodeId) => {
        const inCount = countInEdges(nodeId);

        if (inCount < minInEdges) {
            minInEdges = inCount;
        }
    });

    const columns: { [key: string]: number } = {};
    while (true) {
        let changedAny = false;
        const visitedEdges: { [key: string]: boolean } = {};
        graph.blockIds().forEach((blockId) => {
            let columnIndex = 0;

            graph.inEdges(blockId).forEach((edge) => {
                const edgeId = toEdgeId(edge.providerId, edge.consumerId);
                if (visitedEdges[edgeId]) {
                    return;
                }
                // Avoid recursive loops
                visitedEdges[edgeId] = true;
                if (edge.providerId in columns) {
                    const newIndex = columns[edge.providerId] + 1;
                    if (newIndex > columnIndex) {
                        columnIndex = newIndex;
                    }
                }
            });

            const currentIndex = columns[blockId];

            if (currentIndex === undefined) {
                columns[blockId] = columnIndex;
                console.log('setting', blockId, columnIndex);
                changedAny = true;
            } else if (currentIndex < columnIndex) {
                columns[blockId] = columnIndex;
                console.log('updating', blockId, columnIndex);
                changedAny = true;
            }
        });
        if (!changedAny) {
            break;
        }
    }

    const nodeMatrix: string[][] = [];
    const blockSizes: { [key: string]: { instanceBlockWidth: number; instanceBlockHeight: number } } = {};

    graph.blockIds().forEach((blockId) => {
        const columnIndex = columns[blockId];
        if (!nodeMatrix[columnIndex]) {
            nodeMatrix[columnIndex] = [];
        }
        nodeMatrix[columnIndex].push(blockId);
        const blockDef = graph.definition(blockId).content;
        blockSizes[blockId] = calculateBlockSize({
            nodeSize: opts.nodeSize,
            blockType: BlockTypeProvider.get(blockDef.kind),
            blockDefinition: blockDef,
            blockMode: BlockMode.SHOW,
        });
    });

    let columnIndex = 0;
    let currentX = CANVAS_OFFSET_LEFT;
    while (true) {
        const column = nodeMatrix[columnIndex];
        if (!column) {
            break;
        }

        column.sort((a, b) => {
            return countEdges(b) - countEdges(a);
        });

        let currentY = CANVAS_OFFSET_TOP + ((columnIndex % 2) * NODE_HEIGHT) / 2;
        let maxXForColumn = currentX;
        column.forEach((blockId) => {
            const block = graph.block(blockId);
            const blockSize = blockSizes[blockId];

            block.dimensions.top = currentY;
            block.dimensions.left = currentX;
            const newX = currentX + Math.max(opts.nodeWidth, blockSize.instanceBlockWidth) + opts.marginX;
            if (newX > maxXForColumn) {
                maxXForColumn = newX;
            }
            currentY += Math.max(NODE_HEIGHT, blockSize.instanceBlockHeight) + opts.marginY;
        });
        currentX = maxXForColumn;
        columnIndex++;
    }

    Object.entries(columns).forEach(([blockId, columnIndex]) => {});

    return plan;
}

function toOptions(options: Partial<LayoutOptions> | undefined): LayoutOptions {
    if (!options) {
        options = {
            marginX: DEFAULT_LAYOUT_MARGIN_X,
            marginY: DEFAULT_LAYOUT_MARGIN_Y,
            nodeSize: PlannerNodeSize.FULL,
            nodeWidth: NODE_WIDTH,
        };
    }

    if (!options.marginX) {
        options.marginX = DEFAULT_LAYOUT_MARGIN_X;
    }

    if (!options.marginY) {
        options.marginY = DEFAULT_LAYOUT_MARGIN_Y;
    }

    if (!options.nodeWidth) {
        options.nodeWidth = NODE_WIDTH;
    }

    if (!options.nodeSize) {
        options.nodeSize = PlannerNodeSize.FULL;
    }

    return {
        marginX: options.marginX,
        nodeWidth: options.nodeWidth,
        marginY: options.marginY,
        nodeSize: options.nodeSize,
    };
}

interface BlockConnection {
    consumerId: string;
    providerId: string;
}

class GraphHandler {
    private readonly plan: Plan;
    private readonly blockDefinitions: AssetInfo<BlockDefinition>[];
    constructor(plan: Plan, blocks: AssetInfo<BlockDefinition>[]) {
        this.plan = plan;
        this.blockDefinitions = blocks;
    }

    definition(blockId: string) {
        const uri = parseKapetaUri(this.block(blockId).block.ref);
        return this.blockDefinitions.find((block) => parseKapetaUri(block.ref).equals(uri))!;
    }

    blocks() {
        return this.plan.spec.blocks;
    }

    blockIds() {
        return this.blocks().map((block) => block.id);
    }

    blockEdges(): BlockConnection[] {
        const uniqueEdges: { [key: string]: boolean } = {};
        const edges: BlockConnection[] = [];

        this.plan.spec.connections.forEach((connection) => {
            const key = `${connection.provider.blockId}-${connection.consumer.blockId}`;
            if (!uniqueEdges[key]) {
                uniqueEdges[key] = true;
                edges.push({
                    consumerId: connection.consumer.blockId,
                    providerId: connection.provider.blockId,
                });
            }
        });

        return edges;
    }

    inEdges(blockId: string) {
        return this.blockEdges().filter((connection) => connection.consumerId === blockId);
    }

    outEdges(blockId: string) {
        return this.blockEdges().filter((connection) => connection.providerId === blockId);
    }

    block(nodeId: string) {
        return this.plan.spec.blocks.find((block) => block.id === nodeId)!;
    }
}
