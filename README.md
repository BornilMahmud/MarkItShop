# MarkItShop

Full-stack electronics eCommerce platform with a customer storefront and admin dashboard.

## Owner
- Name: Bornil Mahmud
- GitHub: https://github.com/BornilMahmud
- Repository: https://github.com/BornilMahmud/MarkItShop

## Website Screenshot
![MarkItShop Web Screenshot](./public/slider%20image%201.webp)

## Tech Stack
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Database: MySQL + Prisma
- Auth: NextAuth
- Email: Brevo SMTP

## Main Features
- User registration and login
- Product search, categories, cart, and checkout
- Mobile banking checkout (bKash, Nagad, Rocket)
- Admin order management with order confirmation flow
- Inventory updates after successful order
- Order confirmation email to logged-in account

## Run Locally
1. Install dependencies:

```bash
npm install
cd server
npm install
```

2. Create environment files:
- Root .env
- server/.env

3. Run backend:

```bash
cd server
npm start
```

4. Run frontend:

```bash
npm run dev -- -p 3001
```

5. Open:
- Frontend: http://localhost:3001
- Backend health: http://localhost:3002/health

## Notes
- Email confirmation requires valid Brevo SMTP credentials in server/.env.
- Admin receives CC only if ADMIN_NOTIFICATION_EMAIL is set.
