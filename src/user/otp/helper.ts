import { sendEmail } from "./nodeMailer";
import OTP from "./otpModel";
import bcrypt from 'bcrypt';

export async function sendOtpService(
  email: string,
  name: string,
  purpose: "VERIFY_EMAIL" | "LOGIN" | "RESET_PASSWORD" = "VERIFY_EMAIL"
) {

  const otp = Math.floor(1000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await OTP.deleteMany({ email, purpose });

  await OTP.create({
    email,
    otpHash,
    purpose,
    attempts: 0,
    used: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });

  await sendEmail(email, otp, name);

  return { success: true, message: `OTP sent successfully on ${email}`};
};