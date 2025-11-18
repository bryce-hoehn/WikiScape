declare module 'fuse.js' {
  export interface FuseOptions<T> {
    keys?: Array<string | { name: string; weight?: number }>;
    threshold?: number;
    includeScore?: boolean;
    minMatchCharLength?: number;
    [key: string]: any;
  }

  export interface FuseResult<T> {
    item: T;
    score?: number;
    [key: string]: any;
  }

  export default class Fuse<T> {
    constructor(items: T[], options?: FuseOptions<T>);
    search(query: string): FuseResult<T>[];
  }
}

