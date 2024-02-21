/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Plan } from '@kapeta/schemas';
import { ConnectionMethodMappingType } from '@kapeta/ui-web-types';

export const ValidPlannerData: Plan = {
    kind: 'core/plan',
    metadata: {
        name: 'kapeta/my-todo-system',
    },
    spec: {
        blocks: [
            {
                id: 'user',
                name: 'Users',
                block: {
                    ref: 'kapeta/user:local',
                },

                dimensions: {
                    top: 0,
                    width: 150,
                    left: 250,
                    height: -1,
                },
            },
            {
                id: 'user2',
                name: 'Users 2',
                block: {
                    ref: 'kapeta/user:local',
                },

                dimensions: {
                    top: 700,
                    width: 150,
                    left: 750,
                    height: -1,
                },
            },
            {
                id: 'todo',
                name: 'Todo service',
                block: {
                    ref: 'kapeta://kapeta/todo:1.2.3',
                },

                dimensions: {
                    top: 100,
                    width: 150,
                    left: 850,
                    height: -1,
                },
            },
            {
                id: 'todo2',
                name: 'Todo service 2',
                block: {
                    ref: 'kapeta/todo:local',
                },

                dimensions: {
                    top: 500,
                    width: 150,
                    left: 350,
                    height: -1,
                },
            },
            {
                id: 'images',
                name: 'Image service',
                block: {
                    ref: 'kapeta/image:local',
                },

                dimensions: {
                    top: 300,
                    width: 150,
                    left: 350,
                    height: -1,
                },
            },
            {
                id: 'todo-frontend',
                name: 'Todo frontend',
                block: {
                    ref: 'kapeta/todo-frontend:local',
                },

                dimensions: {
                    top: 300,
                    width: 150,
                    left: 850,
                    height: -1,
                },
            },
            {
                id: 'todo-mobile',
                name: 'Todo mobile app',
                block: {
                    ref: 'kapeta/todo-mobile:local',
                },

                dimensions: {
                    top: 500,
                    width: 150,
                    left: 850,
                    height: -1,
                },
            },
            {
                id: 'gateway',
                name: 'Web gateway',
                block: {
                    ref: 'kapeta/gateway:local',
                },

                dimensions: {
                    top: 700,
                    width: 150,
                    left: 950,
                    height: -1,
                },
            },
        ],

        connections: [
            {
                provider: {
                    blockId: 'user',
                    resourceName: 'users',
                },
                consumer: {
                    blockId: 'todo',
                    resourceName: 'users',
                },
                port: {
                    type: 'rest',
                },
                mapping: {
                    getUser: {
                        targetId: 'getUserById',
                        type: ConnectionMethodMappingType.EXACT,
                    },
                    createUser: {
                        targetId: 'makeUser',
                        type: ConnectionMethodMappingType.EXACT,
                    },
                    deleteUser: {
                        targetId: 'removeUser',
                        type: ConnectionMethodMappingType.EXACT,
                    },
                },
            },
        ],
    },
};

export const InvalidPlannerData: Plan = {
    kind: 'core/plan',
    metadata: {
        name: 'kapeta/my-todo-system',
    },
    spec: {
        blocks: [
            {
                id: 'user-missing-resource',
                name: 'User Missing Resource',
                block: {
                    ref: 'kapeta/user-missing-resource:local',
                },

                dimensions: {
                    top: 0,
                    width: 150,
                    left: 250,
                    height: -1,
                },
            },
            {
                id: 'user-invalid-resource',
                name: 'User Invalid Resource',
                block: {
                    ref: 'kapeta/user-invalid-resource:local',
                },

                dimensions: {
                    top: 700,
                    width: 150,
                    left: 750,
                    height: -1,
                },
            },
            {
                id: 'user-missing-target',
                name: 'User Missing Target',
                block: {
                    ref: 'kapeta/user-missing-target:local',
                },

                dimensions: {
                    top: 0,
                    width: 150,
                    left: 250,
                    height: -1,
                },
            },
            {
                id: 'user-invalid-target',
                name: 'User Invalid Target',
                block: {
                    ref: 'kapeta/user-invalid-target:local',
                },

                dimensions: {
                    top: 700,
                    width: 150,
                    left: 750,
                    height: -1,
                },
            },
            {
                id: 'ext-todo-missing-kind',
                name: 'External Missing Kind',
                block: {
                    ref: 'kapeta://kapeta/todo-missing-kind:1.2.3',
                },

                dimensions: {
                    top: 100,
                    width: 150,
                    left: 850,
                    height: -1,
                },
            },
            {
                id: 'ext-todo-invalid-kind',
                name: 'Ext Invalid Kind',
                block: {
                    ref: 'kapeta://kapeta/todo-invalid-kind:1.2.3',
                },

                dimensions: {
                    top: 100,
                    width: 150,
                    left: 850,
                    height: -1,
                },
            },
            {
                id: 'todo-invalid-kind',
                name: 'Invalid Kind',
                block: {
                    ref: 'kapeta/todo-invalid-kind:local',
                },

                dimensions: {
                    top: 500,
                    width: 150,
                    left: 350,
                    height: -1,
                },
            },
            {
                id: 'todo-missing-kind',
                name: 'Todo Missing Kind',
                block: {
                    ref: 'kapeta/todo-missing-kind:local',
                },

                dimensions: {
                    top: 500,
                    width: 150,
                    left: 550,
                    height: -1,
                },
            },
            {
                id: 'invalid',
                name: 'Invalid Refs',
                block: {
                    ref: 'kapeta/invalid-refs:6.5.2',
                },

                dimensions: {
                    top: 700,
                    width: 150,
                    left: 950,
                    height: -1,
                },
            },
        ],

        connections: [],
    },
};

export const WonkyConnectionPlannerData: Plan = {
    kind: 'core/plan',
    metadata: {
        name: 'kapeta/my-wonky-connection',
    },
    spec: {
        blocks: [
            {
                id: 'user',
                name: 'Users',
                block: {
                    ref: 'kapeta/user:local',
                },
                dimensions: {
                    top: 400,
                    width: 150,
                    left: 250,
                    height: -1,
                },
            },
            {
                id: 'avoid',
                name: 'Avoid me',
                block: {
                    ref: 'kapeta://kapeta/todo:1.2.3',
                },
                dimensions: {
                    top: 400,
                    width: 150,
                    left: 690,
                    height: -1,
                },
            },
            {
                id: 'move',
                name: 'Move me',
                block: {
                    ref: 'kapeta://kapeta/todo:1.2.3',
                },
                dimensions: {
                    top: 300,
                    width: 150,
                    left: 690,
                    height: -1,
                },
            },
            {
                id: 'todo',
                name: 'Todo service',
                block: {
                    ref: 'kapeta://kapeta/todo:1.2.3',
                },
                dimensions: {
                    top: 400,
                    width: 150,
                    left: 1090,
                    height: -1,
                },
            },
        ],
        connections: [
            {
                provider: {
                    blockId: 'user',
                    resourceName: 'users',
                },
                consumer: {
                    blockId: 'todo',
                    resourceName: 'users',
                },
                port: {
                    type: 'rest',
                },
                mapping: {},
            },
        ],
    },
};
