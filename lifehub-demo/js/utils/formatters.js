export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function dueLabel(value) {
  const dueDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day(s) overdue`;
  }
  if (diffDays === 0) {
    return "Due today";
  }
  if (diffDays <= 2) {
    return `Due in ${diffDays} day(s)`;
  }
  return `Upcoming in ${diffDays} day(s)`;
}

export function isUrgent(value) {
  const dueDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
  return diffDays <= 1;
}
