export class CorrespondenceWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CorrespondenceWorkflowError";
  }
}
