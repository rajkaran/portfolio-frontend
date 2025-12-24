export interface User {
  email: string;
  displayName: string;
  promptsLeft: number;
  otpSent?: boolean;
  createDatetime: string;
  id: string;
}
