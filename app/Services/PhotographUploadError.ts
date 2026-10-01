export class PhotographUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotographUploadError";
  }
}
