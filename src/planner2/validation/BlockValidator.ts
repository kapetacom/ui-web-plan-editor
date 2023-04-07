import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { BlockInstanceSpec, BlockKind, ResourceKind } from '@kapeta/ui-web-types';
import { ValidationIssue } from '../types';

export class BlockValidator {
    private readonly block: BlockKind;

    private instance: BlockInstanceSpec;

    constructor(block: BlockKind, instance: BlockInstanceSpec) {
        this.block = block;
        this.instance = instance;
    }

    public validateResource(resource: ResourceKind) {
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

    public validateBlock() {
        const errors: string[] = [];
        if (!this.block.metadata.name) {
            errors.push('No name is defined for block');
        }

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
            errors.push(`Block reference was invalid: ${e.message}`);
        }

        try {
            const blockType = BlockTypeProvider.get(this.block.kind);
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

    public toIssues(): ValidationIssue[] {
        const errors = this.validateBlock();

        const out = [
            ...errors.map((issue) => {
                return {
                    level: 'block',
                    name: this.instance.name ?? this.block.metadata.title ?? this.block.metadata.name,
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
