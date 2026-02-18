export const formatLocalYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseYmdToLocalDate = (ymd: string) => {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day);
};
