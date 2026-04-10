# 🧪 Integration Testing Guide - Email Template & Admin/User Flow

## Overview
Your eCommerce system is now fully configured with:
- ✅ Custom professional email template
- ✅ Brevo SMTP email service (VERIFIED & CONNECTED)
- ✅ Admin product management
- ✅ User shop & checkout flow
- ✅ Manual mobile payment (bKash/Nagad/Rocket)
- ✅ 130 BDT fixed shipping
- ✅ Order confirmation emails with itemized details
- ✅ BDT currency throughout UI

**Server:** http://localhost:3001

---

## 🚀 Quick Start Testing

### Phase 1: Admin Panel Verification

#### Step 1.1: Access Admin Dashboard
1. Navigate to: `http://localhost:3001/admin`
2. You should see either:
   - Admin login page (if not authenticated)
   - Admin dashboard (if already logged in)
3. **Expected:** Page loads without errors, shows admin interface

#### Step 1.2: Check Admin Features
From admin dashboard, verify these sections load:
- Dashboard (overview with stats)
- Products (list/create/edit/delete)
- Orders (list/view/update status)
- Categories (manage dynamic categories)
- Users (view registered users)
- Bulk upload (CSV import)

**Expected:** No error messages, all sections accessible

#### Step 1.3: Create a Test Product (With Image)
1. Go to **Admin → Products → New Product**
2. Fill in:
   - **Title:** Test Product
   - **Price:** 500 (BDT)
   - **Category:** (select from dropdown)
   - **Description:** Test product for email verification
   - **Stock:** 10 units
3. Add Image:
   - **Option A - File Upload:** Upload a product image (JPG/PNG)
   - **Option B - Google Drive:** Paste a Google Drive shared link
4. Click **Create Product**
5. **Expected:** 
   - Product created successfully
   - Redirects to product detail or list page
   - Product visible in product list

#### Step 1.4: View Orders in Admin Panel
1. Go to **Admin → Orders**
2. **Expected:** 
   - Orders list displays (may be empty initially)
   - Can click individual orders to view details
   - Order details show: customer info, items, payment method, address

#### Step 1.5: Update Order Status (Trigger Status Email)
1. If you have orders, select one
2. Change status from "pending" to "processing"
3. Click **Save/Update**
4. **Expected:** 
   - Status updates successfully
   - Email service sends status update email (check logs in terminal)
   - No errors in console

---

### Phase 2: User Shop & Checkout Flow

#### Step 2.1: Browse Shop as Customer
1. Navigate to: `http://localhost:3001/shop`
2. **Expected:**
   - Products display with images
   - Products show prices in **BDT** (₳ symbol)
   - Categories sidebar visible and clickable
   - Filter/sort options work

#### Step 2.2: Register New User Account
1. Go to: `http://localhost:3001/register`
2. Fill in:
   - **Email:** test@example.com (or unique email)
   - **Password:** password123
   - **First Name:** Test
   - **Last Name:** User
3. Click **Register**
4. **Expected:** 
   - Account created successfully
   - Redirected to login or dashboard

#### Step 2.3: Login with New Account
1. Go to: `http://localhost:3001/login`
2. Enter credentials from Step 2.2
3. Click **Login**
4. **Expected:** 
   - Login succeeds
   - Redirected to home or dashboard
   - Header shows **"Test User"** (not email prefix)

#### Step 2.4: Add Product to Cart
1. Go to `/shop`
2. Click on a product to view details
3. Click **"Add to Cart"** button
4. Adjust quantity if needed
5. **Expected:**
   - Product adds to cart
   - Cart count updates in header
   - Prices show in **BDT**

#### Step 2.5: Proceed to Checkout
1. Navigate to: `http://localhost:3001/cart`
2. Verify items are in cart with correct quantities
3. Click **"Proceed to Checkout"** button
4. **Expected:**
   - Checkout page loads with order summary
   - Items list shows product names, quantities, prices
   - Subtotal displays in BDT
   - **Shipping charge shows: 130 BDT** (FIXED)
   - Total displays (subtotal + 130)

#### Step 2.6: Fill Checkout Form
1. On checkout page, fill in:
   - **First Name:** John
   - **Last Name:** Doe
   - **Email:** test@example.com
   - **Phone:** 01700000000
   - **Company:** (optional)
   - **Address:** 123 Main Street
   - **Apartment:** Apt 4B
   - **City:** Dhaka
   - **Country:** Bangladesh
   - **Postal Code:** 1000
2. **Expected:** All fields accept input, no validation errors

#### Step 2.7: Select Payment Method & Details
1. Under **Payment Method**, select:
   - **bKash** (or Nagad/Rocket)
2. Fill in:
   - **Payment Phone:** 01700000000 (or payment service number)
   - **Transaction ID:** ABC123456789
3. **Expected:**
   - Payment methods available
   - Phone/Transaction ID fields visible and accept input

#### Step 2.8: Submit Order
1. Click **"Place Order"** button
2. **Expected:**
   - Order created successfully
   - Redirected to success page or order confirmation
   - Order number displayed
   - Message: "Order created successfully" or similar
   - **NO ERRORS** in page or browser console

---

### Phase 3: Verify Email Template & Delivery

#### Step 3.1: Check Customer Email Inbox
After placing order in Step 2.8:

1. Check the email inbox for: `test@example.com`
2. Look for email subject like: **"Order Confirmation - #ORDER123456"**
3. **Expected Email Content:**
   - ✅ Professional HTML template with purple gradient header
   - ✅ Order ID prominently displayed
   - ✅ Order Date
   - ✅ **Itemized list** showing:
     - Product name
     - Quantity ordered
     - Unit price (in BDT)
     - Subtotal for each item
   - ✅ **Order Summary:**
     - Subtotal
     - Shipping Charge: **130 BDT**
     - Total (BDT)
   - ✅ **Payment Information:**
     - Payment Method: bKash (or selected option)
     - Payment Phone: 01700000000
     - Transaction ID: ABC123456789
   - ✅ **Shipping Address:**
     - Full address with apartment, city, country, postal code
     - Customer phone number
   - ✅ Professional footer with branding

#### Step 3.2: Check Admin CC Email
1. Check inbox for: **ADMIN_NOTIFICATION_EMAIL** (from server/.env)
  - Default: bornilmahmud738@gmail.com
  - Or check your configured admin email
2. **Expected:** 
  - Receive same order confirmation email
  - CC'd on customer order
  - Same template and details

#### Step 3.3: Verify Email Template Quality
Email should look professional with:
- ✅ Purple gradient background (#667eea → #764ba2)
- ✅ Clear section organization
- ✅ Readable font sizes and colors
- ✅ Responsive layout (works on mobile/desktop)
- ✅ No plain text fallback (unless HTML rendering fails)
- ✅ All data populated correctly (no missing placeholders)

---

### Phase 4: Verify Order History & Management

#### Step 4.1: Check User Order History
1. Navigate to: `http://localhost:3001/orders`
2. **Expected:**
   - Recent order displays in list
   - Shows: Order ID, Date, Total (BDT), Status
   - Can click order to view details
   - **No error messages** like "Failed to load orders"

#### Step 4.2: View Order Details (User)
1. Click on order from order history
2. **Expected:**
   - Order detail page loads
   - Shows all items ordered
   - Shows payment details
   - Shows shipping address
   - Shows order status (e.g., "pending")

#### Step 4.3: Check Admin Order Management
1. Go to Admin → Orders
2. Find the order from Step 2.8
3. **Expected:**
   - Order visible in admin list
   - Can click to view full details
   - Admin can see customer payment info (phone, transaction ID)

---

## 🔧 System Configuration Verification

### Email Configuration
Check `server/.env` file for:

```
BREVO_SMTP_KEY=your_brevo_smtp_key_here
BREVO_SMTP_USER=your_brevo_smtp_user_here
BREVO_SMTP_PORT=587
BREVO_FROM_EMAIL=your_verified_sender_email@example.com
ADMIN_NOTIFICATION_EMAIL=your_admin_notification_email@example.com
```

**Status:** ✅ VERIFIED & CONNECTED

### Email Template File
Location: `server/templates/orderConfirmationEmail.html`
- ✅ File exists and is readable
- ✅ Contains all required placeholders
- ✅ Professional HTML with inline CSS
- ✅ Responsive design

### Email Service
Location: `server/services/orderEmailService.js`
- ✅ `renderEmailTemplate()` function implemented
- ✅ Accepts all order parameters (items, subtotal, etc.)
- ✅ Error handling with try-catch
- ✅ Logging enabled for debugging

### Order Controller
Location: `server/controllers/customer_orders.js`
- ✅ `createCheckoutOrder()` passes full order data to email service
- ✅ Includes itemized products array
- ✅ Includes subtotal calculation
- ✅ Sends CC to admin email

---

## ✅ Test Checklist

Copy this into a test document and check off as you verify:

### Admin Panel
- [ ] Admin dashboard accessible and loads
- [ ] Can create product with image
- [ ] Can view products list
- [ ] Can edit product details
- [ ] Can view orders
- [ ] Can update order status
- [ ] Status update triggers email

### User Account
- [ ] Can register new account
- [ ] User name displays correctly (not email prefix)
- [ ] Can login successfully
- [ ] Can logout

### User Shop & Checkout
- [ ] Shop page displays products with images
- [ ] Products show prices in BDT
- [ ] Categories sidebar filters correctly
- [ ] Can add products to cart
- [ ] Cart updates correctly
- [ ] Checkout page shows all fields
- [ ] **Shipping charge fixed at 130 BDT** ✅
- [ ] Payment methods available (bKash/Nagad/Rocket)
- [ ] Can enter payment phone & transaction ID
- [ ] Can submit order successfully
- [ ] **No errors after order submission**

### Email Verification
- [ ] Customer receives order confirmation email
- [ ] Email template renders (not plain text)
- [ ] Email shows purple gradient header
- [ ] Email includes itemized product list
- [ ] Email shows subtotal + 130 BDT shipping = total
- [ ] Email shows payment method & transaction ID
- [ ] Email shows complete shipping address
- [ ] Admin receives CC copy
- [ ] Email formatting looks professional

### Order Management
- [ ] Order appears in user's order history
- [ ] Order appears in admin orders list
- [ ] Can view order details as user
- [ ] Can view order details as admin
- [ ] Admin can update order status
- [ ] Status change sends update email

---

## 🐛 Troubleshooting

### Email Not Arriving?
1. Check server logs for errors (look for "Failed to send email")
2. Verify `BREVO_SMTP_USER` = `a7aa8f001@smtp-brevo.com` (not "apikey")
3. Check spam/junk folder
4. Verify email addresses in test matches configured admin email

### 130 BDT Shipping Not Showing?
1. Check checkout calculation: subtotal + 130 = total
2. Verify BDT symbol displays (₳ or "BDT")
3. Check order confirmation email includes "Shipping Charge: 130 BDT"

### Payment Fields Not Showing?
1. Ensure payment method is selected
2. Check `components/Checkout.tsx` or similar for conditional rendering
3. Verify form fields are not hidden by CSS

### Admin Features Not Working?
1. Ensure logged in as admin user
2. Check browser console for JavaScript errors
3. Check terminal for backend errors

---

## 📊 Success Indicators

You'll know everything is working when:

✅ **Admin Panel:**
- Can create products with Google Drive or file upload
- Can edit/delete products
- Products have correct prices and stock levels
- Can view and manage customer orders

✅ **User Shop & Checkout:**
- Browse products with images and correct BDT pricing
- Add to cart and checkout smoothly
- Submit order with manual payment fields (phone, transaction ID)
- See **130 BDT shipping** in order total

✅ **Email Template:**
- Receive professional HTML email with purple branding
- Email shows all order items with quantities and prices
- Shows correct subtotal + 130 BDT shipping = total
- Shows payment method and transaction ID
- Admin receives CC copy

✅ **Order Management:**
- Order appears in customer history
- Admin can view and update order status
- Status updates trigger confirmation emails

---

## 📝 Notes

- **Development Mode:** Application running in dev mode—rebuild required for production
- **Database:** Orders and products stored in MySQL via Prisma
- **Currency:** All prices displayed in BDT (Bangladeshi Taka)
- **Shipping:** Fixed 130 BDT charge applies to all orders
- **Email Service:** Brevo SMTP verified and tested ✓

---

## 🎯 Next Steps After Testing

If all tests pass:
1. Deploy to production (build process handles optimization)
2. Update admin/user credentials for live environment
3. Configure Brevo email credentials for production domain
4. Set up SSL certificates
5. Configure custom domain
6. Add analytics/monitoring

---

**Happy Testing! 🚀**

For issues or questions, check the browser console (F12) and terminal logs for detailed error messages.
