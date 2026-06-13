import nodemailer from 'nodemailer';
import swarmBus from './swarmBus.js';

// Setup your SMTP transporter (This uses environment variables we will set up in Step 5)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

swarmBus.on('task:comms', async (emailData) => {
    swarmBus.emit('agent:thought', 'Comms_Agent', `Preparing to send email to: ${emailData.to}`);
    
    try {
        // Construct the email payload
        const mailOptions = {
            from: `"Ghouls OS" <${process.env.SMTP_USER}>`,
            to: emailData.to,
            subject: emailData.subject,
            text: emailData.body
        };

        swarmBus.emit('agent:thought', 'Comms_Agent', `Firing SMTP payload to destination...`);
        
        // Send the email
        const info = await transporter.sendMail(mailOptions);

        swarmBus.emit('agent:log', 'Comms_Agent', `Message successfully sent! Message ID: ${info.messageId}`);
        
        // Trigger the next step in the Orchestrator queue
        swarmBus.emit('orchestrator:next');
        
    } catch (error) {
        swarmBus.emit('agent:log', 'Comms_Agent', `Transmission failed: ${error.message}`);
        // If it fails, throw it back to the CEO for self-correction
        swarmBus.emit('orchestrator:error', `Comms_Agent failed to send email to ${emailData.to}: ${error.message}`);
    }
});