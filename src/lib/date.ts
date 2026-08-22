export function createUtcDate(): Date {
  return new Date(Date.now());
}

export function getCurrentDateString(): string {
  const now = createUtcDate();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function setToEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

export function calculateDueDate(monthsToAdd = 3): Date {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setMonth(today.getMonth() + monthsToAdd);
  return setToEndOfDay(dueDate);
}

export function calculateDueDateFrom(
  fromDate: Date,
  monthsToAdd: number
): Date {
  const dueDate = new Date(fromDate);
  dueDate.setMonth(fromDate.getMonth() + monthsToAdd);
  return setToEndOfDay(dueDate);
}
