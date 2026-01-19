export class AstroError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AstroError";
  }
}

export const AstroErrorData = {
  InvalidConfig: "Invalid configuration",
};
