# LocalBiz — AI-Powered Digital Marketplace for Local Entrepreneurs

> Prototype for Group 6 (Shoaib Khan & Aditi Khandge), TCET Mumbai.
> Designed with the **Editorial Craft & Luxury Light** aesthetic matching the project reference mockup.

---

## 🚀 Quick Start (Running the App)

The application is already running and ready! You can test it immediately:

### Option 1: Full-Stack Integrated Server (Backend + Built Frontend)
To run everything on a single port (**http://localhost:5000**):
```bash
npm start
```
* **Frontend UI & Marketplace:** [http://localhost:5000](http://localhost:5000)
* **REST API Endpoints:** [http://localhost:5000/api/products](http://localhost:5000/api/products)

### Option 2: Live Frontend Development Mode (Vite Hot-Reload)
```bash
npm run dev
```
* **Vite Dev Server:** [http://localhost:5173](http://localhost:5173) (automatically proxies `/api` requests to port 5000)

---

## 📦 What's Built & Included

### 1. Frontend (React + Tailwind CSS + Lucide Icons)
- **Visual Design:** Matches the uploaded reference image (*"Where Local Craftsmanship Meets Intelligent Commerce"*, Playfair Display editorial serif typography, warm `#FAFAF9` pearl background, glowing emerald pill actions, and Bento grid product cards).
- **Hero & Artisan Spotlight:** Dynamic hero search bar with category pills + floating studio spotlight card for *Priya's Studio - Jaipur* with simulated AI pricing badge.
- **Product Catalog & Filters:** Live search and filtering across Ceramics, Food & Honey, Handloom Textiles, and Wood/Brass Crafts.
- **Product Details Modal:** High-resolution image preview, artisan notes, quantity stepper, and craftsmanship guarantees.
- **Shopping Cart Drawer:** Real-time quantity adjustments, subtotal + free delivery threshold calculations, stored in `localStorage`.
- **Sandbox Checkout:** Delivery address form, simulated payment gateway options (UPI / Card / Cash on Delivery), order creation with test mode notice.
- **Order Tracking:** Interactive timeline showing order progression (`PLACED` → `CONFIRMED` → `SHIPPED` → `DELIVERED`).
- **Vendor Management Workspace:**
  - Real-time business KPIs (Total Revenue, Orders Count, Active Products, Artisan Shops).
  - Add New Product form with instant sample photo presets.
  - Customer Orders Fulfillment table with "Mark Shipped" and "Mark Delivered" actions.
  - Inventory list with stock oversight and delete action.

### 2. Backend (Node.js Express + SQLite)
- **Database File:** [`backend/localbiz.db`](file:///D:/Final_Year_Project/backend/localbiz.db)
- **Tables:** `vendors`, `categories`, `products`, `orders`, `order_items`
- **Pre-Seeded Data:** 4 authentic regional vendors and 7 artisan products (Ceramics, Wild Forest Honey, Handloom Textiles, Aaji's Mango Pickle, Kashmiri Saffron Kahwa, Dhokra Brass Bell, Terracotta Chai Cups).

---

## 🛠️ REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Retrieve products (supports `?category=...&search=...`) |
| `GET` | `/api/products/:id` | Retrieve single product details with vendor info |
| `POST` | `/api/products` | Add new product to SQLite database |
| `DELETE` | `/api/products/:id` | Remove product from database |
| `GET` | `/api/vendors` | List registered artisan vendors |
| `POST` | `/api/orders` | Place order with customer info and cart items |
| `GET` | `/api/orders` | Retrieve customer and vendor orders with line items |
| `PATCH` | `/api/orders/:id/status` | Progress order status (`PLACED`, `SHIPPED`, `DELIVERED`) |
| `GET` | `/api/stats` | Fetch aggregate marketplace KPIs |
