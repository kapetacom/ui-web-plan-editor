import { Plan } from '@kapeta/schemas';
import { ConnectionMethodMappingType } from '@kapeta/ui-web-types';

export const PlannerData: Plan = {
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
