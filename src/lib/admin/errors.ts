/** A privileged-action failure with an HTTP status and a machine-readable code. */
export class AdminError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "ADMIN_ERROR") {
    super(message);
    this.name = "AdminError";
    this.status = status;
    this.code = code;
  }
}
