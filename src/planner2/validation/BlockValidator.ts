import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import {
    BlockDefinition,
    BlockInstance,
    Resource,
    validateEntities,
    validateSchema,
    stripUndefinedProps,
} from '@kapeta/schemas';
import { ValidationIssue } from '../types';

export class BlockValidator {
    private readonly block: BlockDefinition;

    private instance: BlockInstance;

    constructor(block: BlockDefinition, instance: BlockInstance) {
        this.block = block;
        this.instance = instance;
    }

    public validateResource(resource: Resource) {
        const errors: string[] = [];
        if (!resource.metadata.name) {
            errors.push('No name is defined for resource');
        }

        if (!resource.kind) {
            errors.push('No kind is defined for resource');
        }

        try {
            const resourceType = ResourceTypeProvider.get(resource.kind);

            if (resourceType.validate) {
                try {
                    const typeErrors = resourceType.validate(resource, this.block.spec.entities?.types ?? []);
                    errors.push(...typeErrors);
                } catch (e) {
                    errors.push(`Resource was invalid: ${e.message}`);
                }
            }
        } catch (e) {
            errors.push(`Failed for resource kind: ${e.message}`);
        }

        return errors;
    }

    public validateBlockConfiguration(config: any) {
        const errors: string[] = [];
        try {
            const blockType = BlockTypeProvider.get(this.block.kind);
            if (this.block.spec?.configuration?.types && this.block.spec?.configuration?.types?.length > 0) {
                const typeList = this.block.spec.configuration?.types;
                if (typeList?.length > 0) {
                    errors.push(...validateEntities(typeList, config));
                }
            }

            if (blockType?.validateConfiguration) {
                try {
                    const configErrors = blockType.validateConfiguration(this.block, this.instance, config);

                    errors.push(...configErrors);
                } catch (e) {
                    errors.push(`Kind-specific config validation failed: ${e.message}`);
                }
            }
        } catch (e) {
            errors.push(`Failed to validate kind: ${e.message}`);
        }
        return errors;
    }

    public validateBlock() {
        const errors: string[] = [];
        if (!this.block.metadata.name) {
            errors.push('No name is defined for block');
        }

        if (this.instance) {
            if (!this.instance.name) {
                errors.push('No name is defined for instance');
            }

            if (!this.instance.block.ref) {
                errors.push('No block reference found for instance');
            }

            try {
                if (this.instance.block.ref) {
                    parseKapetaUri(this.instance.block.ref);
                }
            } catch (e) {
                errors.push(`BlockDefinition reference was invalid: ${e.message}`);
            }
        }

        if (this.block.spec.providers) {
            errors.push(...this.validateUniqueNames(this.block.spec.providers));
        }

        if (this.block.spec.consumers) {
            errors.push(...this.validateUniqueNames(this.block.spec.consumers));
        }

        try {
            const blockType = BlockTypeProvider.get(this.block.kind);
            if (blockType?.definition?.spec?.schema) {
                //Get rid of null or undefined properties - usually left over by java or similar
                const stripped = stripUndefinedProps(this.block.spec);
                const schemaIssues = validateSchema(blockType?.definition?.spec?.schema, stripped);
                schemaIssues.forEach((issue) => {
                    errors.push(`Schema validation failed: ${issue.message}`);
                });
            }
            if (blockType?.validate) {
                try {
                    const typeErrors = blockType.validate(this.block);

                    errors.push(...typeErrors);
                } catch (e) {
                    errors.push(`Kind-specific validation failed: ${e.message}`);
                }
            }
        } catch (e) {
            errors.push(`Failed to validate kind: ${e.message}`);
        }
        return errors;
    }

    public validate() {
        const errors = this.validateBlock();

        this.block.spec.providers?.forEach((resource) => {
            errors.push(...this.validateResource(resource));
        });

        this.block.spec.consumers?.forEach((resource) => {
            errors.push(...this.validateResource(resource));
        });

        return errors;
    }

    private validateUniqueNames(resources: Resource[]): string[] {
        const errors: string[] = [];
        const errorAppended: string[] = [];
        const map = new Map<string, Resource>();
        resources.forEach((resource) => {
            if (map.has(resource.metadata.name)) {
                if (!errorAppended.includes(resource.metadata.name)) {
                    errorAppended.push(resource.metadata.name);
                    errors.push(`Resource name ${resource.metadata.name} is not unique`);
                }
                return;
            }

            map.set(resource.metadata.name, resource);
        });

        return errors;
    }

    public toIssues(configuration?: any): ValidationIssue[] {
        const errors = this.validateBlock();
        const name = this.instance?.name ?? this.block.metadata.title ?? this.block.metadata.name;
        const out = [
            ...errors.map((issue) => {
                return {
                    level: 'block',
                    name,
                    issue,
                };
            }),

            ...this.validateBlockConfiguration(configuration).map((issue) => {
                return {
                    level: 'configuration',
                    name,
                    issue,
                };
            }),
        ];

        this.block.spec.providers?.forEach((resource) => {
            out.push(
                ...this.validateResource(resource).map((issue) => {
                    return {
                        level: 'provider',
                        name: resource.metadata.name,
                        issue,
                    };
                })
            );
        });

        this.block.spec.consumers?.forEach((resource) => {
            out.push(
                ...this.validateResource(resource).map((issue) => {
                    return {
                        level: 'consumer',
                        name: resource.metadata.name,
                        issue,
                    };
                })
            );
        });

        return out;
    }
}
