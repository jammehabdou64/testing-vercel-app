export type PostingDuration = {
  years: number;
  months: number;
};

/** Whole years and months from the start date through the end date. */
export function postingDuration(
  startsOn: string,
  endsOn: string | null,
  today: string,
): PostingDuration {
  const end = endsOn ?? today;
  if (end < startsOn) {
    return { years: 0, months: 0 };
  }

  const start = dateParts(startsOn);
  const finish = dateParts(end);
  let years = finish.year - start.year;
  let months = finish.month - start.month;

  if (finish.day < start.day) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months };
}

export function dayBefore(isoDate: string): string {
  const { year, month, day } = dateParts(isoDate);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function dateParts(isoDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return {
    year: year ?? 0,
    month: month ?? 1,
    day: day ?? 1,
  };
}
