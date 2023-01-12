
import {ConnectionMethodMappingType, PLAN_KIND, PlanKind} from "@blockware/ui-web-types";

export const PlannerData: PlanKind = {
    kind: PLAN_KIND,
    metadata: {
        name: 'blockware/my-todo-system',
    },
    spec: {
        blocks: [
            {
                id: 'user',
                name: 'Users',
                block: {
                    ref: 'blockware/user'
                },

                dimensions: {
                    top: 0,
                    width: 150,
                    left: 250,
                    height: -1
                }
            },
            {
                id: 'userNos',
                name: 'Users',
                block: {
                    ref: 'blockware/user'
                },

                dimensions: {
                    top: 700,
                    width: 150,
                    left: 750,
                    height: -1
                }
            },
            {
                id: "todo",
                name: "Todo service",
                block: {
                    ref: 'blockware/todo'
                },

                dimensions: {
                    top: 100,
                    width: 150,
                    left: 850,
                    height: -1
                }
            },
            {
                id: "todo2",
                name: "Todo service 3",
                block: {
                    ref: 'blockware/todo'
                },

                dimensions: {
                    top: 300,
                    width: 150,
                    left: 350,
                    height: -1
                }
            }
        ],

        connections: [
            {
                from: {
                    blockId: 'user',
                    resourceName: 'users'
                },
                to: {
                    blockId: 'todo',
                    resourceName: 'users'
                },
                mapping: {
                    getUser: {
                        targetId: 'getUserById',
                        type: ConnectionMethodMappingType.EXACT
                    },
                    createUser: {
                        targetId: 'makeUser',
                        type: ConnectionMethodMappingType.EXACT
                    },
                    deleteUser: {
                        targetId: 'removeUser',
                        type: ConnectionMethodMappingType.EXACT
                    }
                }
            }
        ]
    }
};


