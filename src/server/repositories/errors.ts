export class NotFoundError extends Error {}

export class ConflictError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
  }
}
