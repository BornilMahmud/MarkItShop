const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const createTransporter = () => {
  const brevoKey = process.env.BREVO_SMTP_KEY;
  if (brevoKey) {
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: Number(process.env.BREVO_SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER || 'apikey',
        pass: brevoKey,
      },
    });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const renderEmailTemplate = (templateData) => {
  try {
    const templatePath = path.join(__dirname, '../templates/orderConfirmationEmail.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    Object.keys(templateData).forEach((key) => {
      const value = templateData[key];
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || '');
    });

    return html;
  } catch (error) {
    console.error('Failed to render email template:', error);
    return null;
  }
};

const sendOrderConfirmationEmail = async ({
  to,
  customerName,
  orderId,
  total,
  subtotal,
  shippingCharge,
  paymentMethod,
  paymentPhone,
  transactionId,
  address,
  apartment,
  city,
  country,
  postalCode,
  phone,
  items = [],
}) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('SMTP configuration missing. Skipping order confirmation email.');
    return false;
  }

  const fromEmail =
    process.env.SMTP_FROM ||
    process.env.BREVO_FROM_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.SMTP_USER;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!fromEmail) {
    console.error('Missing sender email configuration. Set BREVO_FROM_EMAIL or SMTP_FROM.');
    return false;
  }
  const paymentMethodLabel = `${paymentMethod}`.toUpperCase();

  const templateData = {
    customerName,
    orderId,
    orderDate: new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
    total: `${total} BDT`,
    subtotal: `${subtotal} BDT`,
    shippingCharge,
    paymentMethod: paymentMethodLabel,
    paymentPhone,
    transactionId,
    address,
    apartment: apartment || 'N/A',
    city,
    country,
    postalCode,
    phone,
    items: items.map((item) => ({
      itemName: item.title || 'Product',
      quantity: item.quantity,
      itemPrice: `${item.price * item.quantity} BDT`,
    })),
  };

  const htmlContent = renderEmailTemplate(templateData);

  const mailPayload = {
    from: fromEmail,
    to,
    ...(adminEmail && adminEmail !== to ? { cc: adminEmail } : {}),
    subject: `Order Confirmation #${orderId.slice(0, 8)} - MarkitShop`,
    text: [
      `Hello ${customerName},`,
      '',
      `Your order has been confirmed.`,
      `Order ID: ${orderId}`,
      `Total: ${total} BDT (Shipping: ${shippingCharge} BDT)`,
      `Payment Method: ${paymentMethodLabel}`,
      `Mobile Number: ${paymentPhone}`,
      `Transaction ID: ${transactionId}`,
      `Shipping Address: ${address}, ${apartment}, ${city}, ${country}, ${postalCode}`,
      '',
      'Thank you for shopping with us.',
    ].join('\n'),
    html: htmlContent || `
      <h2>Order Confirmed</h2>
      <p>Hello ${customerName},</p>
      <p>Your order has been confirmed successfully.</p>
      <ul>
        <li><strong>Order ID:</strong> ${orderId}</li>
        <li><strong>Total:</strong> ${total} BDT</li>
        <li><strong>Shipping:</strong> ${shippingCharge} BDT</li>
        <li><strong>Payment Method:</strong> ${paymentMethodLabel}</li>
        <li><strong>Mobile Number:</strong> ${paymentPhone}</li>
        <li><strong>Transaction ID:</strong> ${transactionId}</li>
        <li><strong>Shipping Address:</strong> ${address}, ${apartment}, ${city}, ${country}, ${postalCode}</li>
      </ul>
      <p>Thank you for shopping with us.</p>
    `,
  };

  try {
    await transporter.sendMail(mailPayload);
    console.log(`✓ Order confirmation email sent to ${to}${adminEmail ? ` (CC: ${adminEmail})` : ''}`);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error && error.message ? error.message : error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
};
