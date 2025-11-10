export type PermissionValue = {
    [key: string]: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      export?: boolean; // Optional for modules like reports
    };
  };