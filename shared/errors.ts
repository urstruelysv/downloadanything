export class ExtractError extends Error {
  constructor(
    public code: string,
    public httpStatus: number,
    msg?: string,
  ) {
    super(msg ?? code);
    this.name = "ExtractError";
  }
}
