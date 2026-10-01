import { Job } from "bun-jcc/Queue/Job";

/**
 * The officer notice for a committed leave submission.
 * Delivery waits until a channel is chosen. Personnel email is optional,
 * and the requirements do not name one.
 */
export class NotifyLeaveSubmitted extends Job {
  static module = import.meta.url;

  constructor(
    public readonly applicationId: number,
    public readonly personnelId: number,
  ) {
    super();
  }

  handle(): void {}
}
