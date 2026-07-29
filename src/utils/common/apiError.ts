export function extractApiErrorMessage(e: any, fallback: string): string {
  return (
    e?.response?.data?.error?.message ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
}
