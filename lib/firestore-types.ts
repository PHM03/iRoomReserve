export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
  valueOf(): string;
  toJSON?(): unknown;
}
