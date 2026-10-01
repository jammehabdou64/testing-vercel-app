import { LeaveWorkflowError } from "./LeaveWorkflowError";

const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** The next calendar day. This does not use a timezone or a duration. */
export function dueBackOn(endsOn: string): string {
  const date = calendarDate(endsOn);
  const length = daysInMonth(date.year, date.month);
  if (length === null) {
    throw new LeaveWorkflowError("The leave date is not a calendar date.");
  }
  let year = date.year;
  let month = date.month;
  let day = date.day + 1;

  if (day > length) {
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return formatDate(year, month, day);
}

export function calendarDate(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new LeaveWorkflowError("The leave date is not a calendar date.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const length = daysInMonth(year, month);
  if (length === null || day < 1 || day > length) {
    throw new LeaveWorkflowError("The leave date is not a calendar date.");
  }

  return { year, month, day };
}

export function formatDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number | null {
  if (month < 1 || month > 12) {
    return null;
  }

  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return monthLengths[month - 1] ?? null;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
