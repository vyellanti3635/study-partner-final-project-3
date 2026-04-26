export class AppError extends Error {
  public readonly status: number;
  public readonly fields?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.fields = fields;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
