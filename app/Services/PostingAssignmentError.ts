export class PostingAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostingAssignmentError";
  }
}
