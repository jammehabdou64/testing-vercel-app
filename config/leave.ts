import { env } from "bun-jcc/helpers";

const configured = env("LEAVE_REFUSE_SECOND_PENDING", true);

export const leave = {
  /**
   * When true, an officer cannot submit while another application is pending.
   * The default is refusal. Set LEAVE_REFUSE_SECOND_PENDING=false to allow a second pending row.
   */
  refuseSecondPending: configured === true || configured === "true" || configured === "1",
};
