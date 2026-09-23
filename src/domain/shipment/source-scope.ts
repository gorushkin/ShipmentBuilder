export type SourceScope =
  | { kind: 'line'; productId: string; sourceLineId: string }
  | { containerId: string; kind: 'container'; productId?: string }
  | { kind: 'product'; next?: boolean; productId: string }
