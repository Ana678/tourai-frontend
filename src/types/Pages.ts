export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number; 
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}