const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const pad = (num) => num.toString().padStart(2, '0');

const formatWhen = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const detailsTable = ({ mentorName, learnerName, skillName, startTime, endTime }) => `
  <table style="border-collapse: collapse;">
    <tr><td style="padding: 6px 12px;"><strong>Mentor:</strong></td><td style="padding: 6px 12px;">${mentorName || '-'}</td></tr>
    <tr><td style="padding: 6px 12px;"><strong>Learner:</strong></td><td style="padding: 6px 12px;">${learnerName || '-'}</td></tr>
    <tr><td style="padding: 6px 12px;"><strong>Skill:</strong></td><td style="padding: 6px 12px;">${skillName || '-'}</td></tr>
    <tr><td style="padding: 6px 12px;"><strong>Starts:</strong></td><td style="padding: 6px 12px;">${formatWhen(startTime)}</td></tr>
    <tr><td style="padding: 6px 12px;"><strong>Ends:</strong></td><td style="padding: 6px 12px;">${formatWhen(endTime)}</td></tr>
  </table>
`;

const meetingBlock = (meetingUrl) => meetingUrl ? `
  <div style="margin: 20px 0;">
    <a href="${meetingUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Join Video Call</a>
    <p style="font-size: 12px; color: #666; margin-top: 8px;">Or copy this link: <a href="${meetingUrl}">${meetingUrl}</a></p>
  </div>
` : '';

const sendBookingMail = async ({ mentorEmail, mentorName, learnerEmail, learnerName, skillName, startTime, endTime, meetingUrl }) => {
  const from = `"SkillSwap" <${process.env.MAIL_USER}>`;
  const details = detailsTable({ mentorName, learnerName, skillName, startTime, endTime });
  const meeting = meetingBlock(meetingUrl);

  const tasks = [];

  if (mentorEmail) {
    tasks.push(transporter.sendMail({
      from,
      to: mentorEmail,
      subject: 'New Session Booking on SkillSwap',
      html: `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Hi ${mentorName || 'there'},</h2>
          <p>You have a new session booking on <strong>SkillSwap</strong>.</p>
          ${details}
          ${meeting}
          <p>Please log in to your SkillSwap account for more details.</p>
          <p style="margin-top: 24px; color: #666;">— The SkillSwap Team</p>
        </div>
      `,
    }));
  }

  if (learnerEmail) {
    tasks.push(transporter.sendMail({
      from,
      to: learnerEmail,
      subject: 'Your SkillSwap Session is Booked',
      html: `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Hi ${learnerName || 'there'},</h2>
          <p>Your session has been booked successfully on <strong>SkillSwap</strong>.</p>
          ${details}
          ${meeting}
          <p>We've notified your mentor. You can also join the video call from your SkillSwap bookings page.</p>
          <p style="margin-top: 24px; color: #666;">— The SkillSwap Team</p>
        </div>
      `,
    }));
  }

  return Promise.all(tasks);
};

module.exports = { sendBookingMail };
