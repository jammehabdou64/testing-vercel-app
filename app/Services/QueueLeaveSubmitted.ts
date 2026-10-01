import { NotifyLeaveSubmitted } from "../Jobs/NotifyLeaveSubmitted";
import type {
  LeaveSubmissionNotice,
  LeaveSubmissionNotifier,
} from "./LeaveSubmissionNotifier";

/** Pushes the officer notice onto the framework queue. */
export class QueueLeaveSubmitted implements LeaveSubmissionNotifier {
  async queue(notice: LeaveSubmissionNotice): Promise<void> {
    await NotifyLeaveSubmitted.dispatch(notice.applicationId, notice.personnelId);
  }
}
