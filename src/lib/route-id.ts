// Route params are strings; the API's ids are positive integers.
export const parseId = (value: string): number | null =>
  /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
