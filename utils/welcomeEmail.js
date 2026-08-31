const nodemailer = require('nodemailer');

/**
 * Sends a welcome email to the newly registered user.
 * 
 * @param {string} userEmail - The email address of the registered user.
 * @param {string} userName - The name of the registered user.
 */
const sendWelcomeEmail = async (userEmail, userName) => {
    // Diagnostic logging
    console.log(`[EMAIL INFO] Attempting to send welcome email to: ${userEmail}`);
    console.log(`[EMAIL INFO] EMAIL_USER exists: ${!!process.env.EMAIL_USER}`);
    console.log(`[EMAIL INFO] EMAIL_PASS exists: ${!!process.env.EMAIL_PASS}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('[EMAIL ERROR] Cannot send email: MISSING_CREDENTIALS');
        return;
    }

    try {
        // Create transporter using Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER.trim(),
                pass: process.env.EMAIL_PASS.trim()
            }
        });

        // Email content with Shree Kishan Ayushi branding
        const mailOptions = {
            from: `"Shree Kishan Ayushi" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: 'Welcome to Shree Kishan Ayushi - Your Health, Our Priority',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <div style="background-color: #1976d2; padding: 40px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Welcome to Shree Kishan Ayushi</h1>
                        <p style="color: rgba(255,255,255,0.8); margin-top: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Modern Clinical Partner</p>
                    </div>
                    
                    <div style="padding: 40px; background-color: #ffffff;">
                        <p style="font-size: 18px; color: #1a237e; font-weight: 600;">Dear ${userName},</p>
                        
                        <p style="font-size: 16px; color: #455a64; line-height: 1.6;">
                            Welcome to the Shree Kishan Ayushi pharmaceutical ecosystem. We are committed to synchronizing premium medical assets with institutional precision.
                        </p>
                        
                        <div style="margin: 30px 0; padding: 25px; background-color: #f8fbff; border-radius: 12px; border-left: 4px solid #1976d2;">
                            <p style="font-size: 15px; color: #1a237e; font-weight: 600; margin-top: 0;">Institutional Privileges:</p>
                            <ul style="font-size: 14px; color: #546e7a; line-height: 1.8; padding-left: 20px; margin-bottom: 0;">
                                <li>Access to 10,000+ Verified Clinical Assets</li>
                                <li>Real-time Procurement & Tracking Nodes</li>
                                <li>Protocol-Driven Healthcare Logistics</li>
                                <li>24/7 Expert Clinical Monitoring</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                               style="background-color: #1976d2; color: white; padding: 16px 40px; 
                                      text-decoration: none; border-radius: 30px; font-weight: bold; 
                                      display: inline-block; box-shadow: 0 4px 14px 0 rgba(25, 118, 210, 0.39);">
                                Access Registry
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #90a4ae; margin-top: 40px; font-style: italic; text-align: center;">
                            "To optimize clinical procurement through technological innovation and absolute categorical integrity."
                        </p>
                    </div>
                    
                    <div style="text-align: center; padding: 30px; background-color: #fcfcfc; border-top: 1px solid #f0f0f0; color: #b0bec5; font-size: 12px;">
                        <p style="margin-bottom: 5px;">© ${new Date().getFullYear()} Shree Kishan Ayushi. All rights reserved.</p>
                        <p style="margin: 0;">This is an automated institutional message. Please do not reply directly.</p>
                        <p style="margin-top: 15px; color: #cfd8dc;">123 Medical Innovation Lane, Health City</p>
                    </div>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email successfully sent to: ${userEmail}`);

    } catch (error) {
        console.error('CRITICAL: Error sending welcome email:', error);
        // We log the error but don't throw to avoid breaking the registration flow
    }
};

module.exports = sendWelcomeEmail;