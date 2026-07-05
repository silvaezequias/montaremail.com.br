export interface EmailVariable {
  id: string;
  key: string;
  value: string;
  description: string;
}

export type Alignment = 'left' | 'center' | 'right';

export interface ElementStyles {
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  borderRadius?: number;
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
  borderWidth?: number;
  borderColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  width?: number;
  height?: number;
  align?: Alignment;
}

export type ElementType =
  | 'heading'
  | 'text'
  | 'button'
  | 'image'
  | 'link'
  | 'divider'
  | 'spacer'
  | 'container'
  | 'grid';

export interface EmailElement {
  id: string;
  type: ElementType;
  content: string; // The text content (can contain variables like {{userName}})
  styles: ElementStyles;
  // Specific attributes:
  href?: string; // For buttons, links, images
  src?: string; // For images
  alt?: string; // For images
  // For layout container & grid elements:
  children?: EmailElement[]; // Ordered list of children inside containers
  rowsCount?: number; // Rows for grid
  colsCount?: number; // Columns for grid
  gridCells?: Record<string, EmailElement[]>; // Row-Col indices to child elements array
}

export interface EmailTemplate {
  id: string;
  name: string;
  elements: EmailElement[];
  variables: EmailVariable[];
  globalStyles: {
    backgroundColor: string;
    containerColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: number;
    padding: number;
    bodyWidth?: number;
    hasWidthLimit?: boolean;
    bodyAlignment?: 'center' | 'left' | 'right';
    bodyMarginTop?: number;
    bodyMarginBottom?: number;
  };
  updatedAt?: number;
  visualIdentity?: VisualIdentity;
}

export interface ReusableComponent {
  id: string;
  name: string;
  element: EmailElement;
  updatedAt?: number;
}

export interface BrandColor {
  id: string;
  name: string;
  value: string;
}

export interface ColorRule {
  id: string;
  name: string;
  variableName: string;
  operator: 'equals' | 'contains' | 'not_equals';
  value: string;
  colorIfTrue: string;
  colorIfFalse: string;
}

export interface VisualIdentity {
  brandColors: BrandColor[];
  colorRules: ColorRule[];
  signatureName: string;
  signatureRole: string;
  signatureCompany: string;
  signaturePhone: string;
  signatureColor: string;
}

export interface Project {
  id: string;
  name: string;
  templates: EmailTemplate[];
  visualIdentity: VisualIdentity;
  reusableComponents: ReusableComponent[];
  updatedAt: number;
}



