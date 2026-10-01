export type LeaveSubmissionNotice = {
  applicationId: number;
  personnelId: number;
};

/** Queues the officer notice after a submission has committed. */
export interface LeaveSubmissionNotifier {
  queue(notice: LeaveSubmissionNotice): Promise<void>;
}
