export async function getVerificationEmailTemplate (email: string, name: string, otp: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .banner {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .content {
            padding: 40px 30px;
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 16px;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 24px;
            font-size: 16px;
        }
        .otp-section {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            margin: 16px 0;
            user-select: all;
            cursor: pointer;
        }
        .copy-instruction {
            color: #999;
            font-size: 13px;
            margin-top: 12px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 14px 40px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .verify-button:hover {
            transform: translateY(-2px);
        }
        .expiry-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .expiry-notice p {
            color: #856404;
            font-size: 14px;
            margin: 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            color: #999;
            font-size: 13px;
            margin-bottom: 8px;
        }
        .divider {
            height: 1px;
            background-color: #e9ecef;
            margin: 24px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="banner">
            ShopHub
        </div>

        <div class="content">
            <h1>Verify Your Email Address</h1>
            <p>Hello ${name}! 👋</p>
            <p>Thank you for signing up with ShopHub. To complete your registration and start shopping, please verify your email address by using the OTP code below.</p>

            <div class="otp-section">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code" id="otpCode">${otp}</div>
                <div class="copy-instruction">Click to select and copy the code</div>
            </div>

            <div class="expiry-notice">
                <p>⏰ This code will expire in 10 minutes for security purposes.</p>
            </div>

            <div class="divider"></div>

            <p>Alternatively, you can click the button below to be redirected to our verification page:</p>

            <div class="button-container">
                <a href="https://your-website.com/verify?email=${encodeURIComponent(email)}" class="verify-button">Verify Email Now</a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #999;">If you didn't create an account with ShopHub, please ignore this email or contact our support team if you have concerns.</p>
        </div>

        <div class="footer">
            <p><strong>ShopHub</strong></p>
            <p>Your trusted online shopping destination</p>
            <p>© 2024 ShopHub. All rights reserved.</p>
            <p>123 Commerce Street, Shopping District, City 12345</p>
        </div>
    </div>

    <script>
        document.getElementById('otpCode').addEventListener('click', function() {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(this);
            selection.removeAllRanges();
            selection.addRange(range);
        });
    </script>
</body>
</html>
  `;
}