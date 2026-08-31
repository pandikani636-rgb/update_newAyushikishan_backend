const nodeMailer = require('nodemailer');

const sendCustomerEmail = async (options) => {
    try {
        const transporter = nodeMailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            service: process.env.SMTP_SERVICE,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const mailOptions = {
            from: `Shree Kishan Aayushi <${process.env.SMTP_MAIL}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Email Success] Sent to ${options.email}`);
    } catch (error) {
        console.error(`[Email Error] Failed to send email to ${options.email}: `, error.message);
    }
};

module.exports = sendCustomerEmail;
