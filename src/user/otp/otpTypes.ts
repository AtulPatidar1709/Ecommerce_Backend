export type OtpPurpose = "VERIFY_EMAIL" | "LOGIN" | "RESET_PASSWORD";

export interface OtpTypes {
  email: string;
  otpHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateOtpPayload {
  email: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface GoogleUser {
  sub: string;          // Google unique ID
  email: string;
  email_verified?: boolean;
  name: string;
  picture?: string;
}
