import { config } from "../../config/config";
import{ getVerificationEmailTemplate } from "./nodeMailerTemplate";

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.MAIL_ADDRESS_KEY,
    pass: config.MAIL_SECRET_KEY,
  },
});

// Send an email using async/await
export async function sendEmail(email : string, otp : string, name : string){

  const htmlTemplate = await getVerificationEmailTemplate(email, name, otp);

  console.log("OTP Send at sendEmail " , otp, email, name);

  const info = await transporter.sendMail({
    from: `"Entry Ecommerce App" <${config.MAIL_ADDRESS_KEY}>`,
    to: `${email}`,
    subject: "Gmail Verification Code",
    text: "",
    html: htmlTemplate, 
  });

  console.log("Message sent:", info.messageId);

  return info;
};