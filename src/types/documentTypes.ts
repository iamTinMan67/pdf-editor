export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface SignatureType {
  id: string;
  type: 'drawn' | 'text';
  dataURL?: string;
  text?: string;
  textStyle?: TextStyle;
  page: number;
  position: Position;
  size: Size;
}

export interface ImageType {
  id: string;
  dataURL: string;
  page: number;
  position: Position;
  size: Size;
  originalName?: string;
}

export interface PageNumberType {
  id: string;
  template: string;
  page: number;
  position: Position;
  startingNumber: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface DocumentState {
  signatures: SignatureType[];
  images: ImageType[];
  pageNumbers: PageNumberType[];
  totalPages: number;
}