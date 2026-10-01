export class LeaveWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeaveWorkflowError";
  }
}
