export interface K8sResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  spec?: any;
  [key: string]: any;
}

export interface JSONSchemaProps {
  description?: string;
  type?: string;
  format?: string;
  title?: string;
  required?: string[];
  items?: JSONSchemaProps;
  properties?: Record<string, JSONSchemaProps>;
  additionalProperties?: JSONSchemaProps | boolean;
  enum?: any[];
  default?: any;
  [key: string]: any;
}

export interface CRDVersion {
  name: string;
  served: boolean;
  storage: boolean;
  schema?: {
    openAPIV3Schema?: JSONSchemaProps;
  };
}

export interface CustomResourceDefinition extends K8sResource {
  spec: {
    group: string;
    names: {
      kind: string;
      listKind?: string;
      plural: string;
      singular?: string;
      shortNames?: string[];
    };
    scope: string;
    versions: CRDVersion[];
  };
}
