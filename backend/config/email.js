import Resend from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
    const from = process.env.EMAIL_FROM;
    await resend.emails.send({
        from,
        to,
        subject,
        html,
    });
};

// Existing email templates and other functionalities remain unchanged.
