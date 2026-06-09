export type EmailFormatVariableDefinition = {
  id: string;
  label: string;
};

export type EmailFormatContentEditPolicy = {
  title: boolean;
  to: boolean;
  cc: boolean;
  attachment: boolean;
  body: boolean;
};

export type EmailFormatRulesEditPolicy = {
  text: boolean;
  list: boolean;
};

export type EmailFormatRule = {
  id: string;
  text: string;
};

export type EmailFormatActivationRequirement =
  | {
      kind: "recipients";
    }
  | {
      kind: "rules";
    }
  | {
      kind: "dataSources";
    };

export type EmailFormatInlineTextContent =
  | string
  | readonly EmailFormatInlineTextPart[];

export type EmailFormatInlineTextPart =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "link";
      label: string;
      href: `/${string}`;
    };
