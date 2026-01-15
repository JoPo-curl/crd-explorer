import yaml from 'js-yaml';
import { K8sResource, CustomResourceDefinition } from '../types';

/**
 * Parses a raw string (YAML) and extracts only CustomResourceDefinitions.
 */
export const parseCRDs = (content: string): CustomResourceDefinition[] => {
  try {
    const documents: K8sResource[] = [];
    
    // js-yaml loadAll allows parsing multi-document yaml files
    yaml.loadAll(content, (doc) => {
      if (doc && typeof doc === 'object') {
        documents.push(doc as K8sResource);
      }
    });

    const crds = documents.filter(
      (doc) => doc.kind === 'CustomResourceDefinition'
    ) as CustomResourceDefinition[];

    // Sort by name for easier navigation
    return crds.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

  } catch (error) {
    console.error("Failed to parse YAML", error);
    throw new Error("Invalid YAML file format.");
  }
};
