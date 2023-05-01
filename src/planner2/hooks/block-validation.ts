import { useContext, useMemo } from 'react';
import { BlockValidator } from '../validation/BlockValidator';
import { BlockDefinition, BlockInstance } from '@kapeta/schemas';
import { PlannerContext } from '../PlannerContext';

interface Props {
    blockInstance: BlockInstance | null;
    blockDefinition?: BlockDefinition;
    configuration?: any;
}

function normalizedName(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const useUniqueBlockNameValidation = (instance?: BlockInstance | null) => {
    const planner = useContext(PlannerContext);

    const errors: string[] = [];
    if (!instance) {
        return errors;
    }

    const instanceName = normalizedName(instance.name);

    if (planner.plan) {
        planner.plan.spec?.blocks?.forEach((block) => {
            if (normalizedName(block.name) === instanceName && block.id !== instance.id) {
                errors.push(`Block instance name "${instance.name}" is not unique. Note that uniqueness is case insensitive and ignores non-alphanumeric characters.`);
            }
        });
    }
    return errors;
};

export const useBlockValidation = (props: Props) => {
    const errors = useMemo(() => {
        if (!props.blockDefinition || !props.blockInstance) {
            return [];
        }
        const validator = new BlockValidator(props.blockDefinition, props.blockInstance);
        return [...validator.validate(), ...validator.validateBlockConfiguration(props.configuration)];
    }, [props.blockDefinition, props.blockInstance, props.configuration]);

    errors.push(...useUniqueBlockNameValidation(props.blockInstance));

    return errors;
};

export const useBlockValidationIssues = (props: Props) => {
    const errors = useMemo(() => {
        if (!props.blockDefinition || !props.blockInstance) {
            return [];
        }
        const validator = new BlockValidator(props.blockDefinition, props.blockInstance);
        return validator.toIssues(props.configuration);
    }, [props.blockDefinition, props.blockInstance, props.configuration]);

    errors.push(
        ...useUniqueBlockNameValidation(props.blockInstance).map((issue) => {
            return {
                level: 'block',
                name: props.blockInstance?.name,
                issue,
            };
        })
    );

    return errors;
};
