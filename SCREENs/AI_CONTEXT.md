# LocalBiz — UI Mockup Generation Context (Master File)

Give this entire file to any AI image generator or assistant. It contains the project background, the final design system, the prompt template rules, and the full screen list with content specs.

---

## 1. Project Background

- Project: **LocalBiz — AI-Powered Digital Marketplace for Local Entrepreneurs**
- Team: Group 6 — Anish & Aditi Khandge (Final Year Project)
- Goal: Generate 21 premium professional UI mockup images, one per screen, to use as design references in the project report and demo.
- Image generator being used: **Gemini (Nano Banana)** — chosen because it renders small UI text more accurately than DALL·E.
- Workflow: one screen at a time. A detailed prompt is written, the image is generated, then evaluated and either accepted or regenerated with targeted fixes.

## 2. Final Design System — "Modern SaaS" (Airbnb / Shopify style)

This replaces the earlier flat cream/green system. ALL screens must follow this:

| Element | Spec |
|---|---|
| Page background | Light grey `#F6F7F9` |
| Cards / surfaces | Pure white, soft drop shadow, 16px rounded corners |
| Primary accent (buttons, active states) | Emerald green `#10B981` |
| Secondary accent (badges, links) | Deep teal `#0F766E` |
| Price / rating accent | Warm amber `#D97706` |
| Headings / primary text | Slate `#1E293B` |
| Muted text | Grey `#64748B` |
| Footer background | Deep slate `#0F172A` |
| Buttons | Pill-shaped (fully rounded): solid emerald primary, white outlined secondary |
| Font | Inter, generous whitespace |

**Style rules (every prompt):**
- Modern premium SaaS look (Airbnb / Shopify / Linear style)
- Flat modern vector UI — no photo-realistic illustration, no 3D render, no heavy gradients
- Desktop browser view, 16:9 aspect ratio, no browser chrome
- Sharp crisp text, every text string spelled exactly as given in quotes
- Hero layouts: left text / right visual (not center-aligned)

## 3. Prompt Template Rules

Every prompt must include:
1. One-line scene description ("A premium modern SaaS UI design mockup of ... for LocalBiz, desktop browser view, 16:9 aspect ratio, no browser chrome")
2. The style paragraph from Section 2
3. Section-by-section layout description with EXACT text strings in quotes
4. Exact hex colors
5. Closing line: "Strictly flat modern vector UI, no photo-realistic illustration, no 3D render, no heavy gradients. Colors: light grey #F6F7F9 background, emerald #10B981 primary, amber #D97706 prices, slate #1E293B text, deep slate #0F172A footer."

## 4. The 21 Screens

1. Landing (Home)
2. Product Detail
3. Browse / Search
4. Storefront (vendor shop page)
5. Cart
6. Checkout & Payment
7. Order Confirmation
8. Customer Orders / Tracking
9. Auth (Login / Sign Up)
10. Vendor Shop Setup Wizard
11. Vendor Dashboard
12. Product Add / Edit
13. Vendor Orders
14. AI Vendor Teaching Assistant (flagship feature)
15. Customer Profile
16. Vendor Products / Inventory
17. Chat with Vendor
18. Admin Dashboard
19. Reviews
20. Notifications
21. Vendor Shop Settings & Preview

## 5. Ready-Made Prompt — Screen 1 (Landing, Modern SaaS)

A premium modern SaaS UI design mockup of an e-commerce marketplace website homepage called "LocalBiz", desktop browser view, 16:9 aspect ratio, no browser chrome. Style: modern premium SaaS like Airbnb and Shopify — pure white cards with soft drop shadows and 16px rounded corners on a light grey #F6F7F9 background, pill-shaped buttons, Inter font, generous whitespace, sharp crisp text, all text perfectly spelled.

Top navbar: white background with a subtle bottom shadow, left side a rounded emerald square app icon with a white shop glyph and text "LocalBiz" in bold slate; center links "Marketplace", "Vendors", "How It Works"; right side a white outlined pill button "Become a Seller" and a solid emerald green pill button "Login / Sign Up" (#10B981).

Hero section: light grey #F6F7F9 background, on the left a large bold slate #1E293B headline "Grow Your Local Business Online", below it smaller grey #64748B subtext "Discover and buy from skilled local entrepreneurs — or start selling in minutes with AI-powered help.", below that a solid emerald pill button "Start Shopping" and next to it a white outlined pill button "Start Selling". On the right side of the hero, a large white rounded card containing a simple abstract illustration of a storefront with small floating UI cards (order notification, 5-star rating). Center-align nothing in the hero — use this left-text right-illustration layout.

Below the hero: a small grey uppercase heading "BROWSE BY CATEGORY" left-aligned, then a single horizontal row of exactly 6 white rounded category cards with soft shadows, evenly spaced, each with a simple colorful icon and label: "Groceries", "Handicrafts", "Home Food", "Clothing", "Services", "Electronics".

Featured Products section: heading "Featured Products" in bold slate left-aligned, 4 white rounded product cards in one row, each with a product photo area, product name, a small shop name in grey, an amber #D97706 price, and a small emerald "Add" pill button.

"Why LocalBiz?" section: heading in bold slate, 3 white rounded cards in a row titled "AI Selling Assistant", "Verified Local Shops", "Fast Local Delivery", each with a simple line icon and two lines of grey text.

Footer: deep slate #0F172A background with four columns of white link text labeled "About", "For Sellers", "Support", "Legal".

Strictly flat modern vector UI, no photo-realistic illustration, no 3D render, no heavy gradients. Colors: light grey #F6F7F9 background, emerald #10B981 primary, amber #D97706 prices, slate #1E293B text, deep slate #0F172A footer.

## 6. Screen 2 (Product Detail) — Content Spec (restyle to Modern SaaS)

A premium modern SaaS UI design mockup of an e-commerce product detail page for "LocalBiz", desktop browser view, 16:9 aspect ratio, no browser chrome. [Add the style paragraph from Section 2.]

Top navbar: same as Screen 1.

Below navbar: a slim breadcrumb "Home / Home Food / Aaji's Homemade Pickles" on the light grey background.

Main content, two columns:
- Left column (~55% width): one large square product photo of a jar of homemade mango pickle inside a white rounded card, with a row of 4 small thumbnail squares below it, one thumbnail highlighted with an emerald border.
- Right column: product title "Aaji's Homemade Mango Pickle" in bold slate; below it "Sold by Aaji's Kitchen" with a small verified badge icon; an amber #D97706 price "₹299 / 250g jar"; a quantity stepper "− 1 +" with rounded grey borders; a large solid emerald pill button "Add to Cart"; below it a white outlined pill button "Chat with Seller"; below that three small grey lines with checkmark icons: "Made fresh to order", "Ships within 2 days", "7-day return policy".

Below the two columns, full width: a white rounded card titled "Product Description" with two short paragraphs of grey placeholder text; next to it a white rounded card titled "Reviews" showing 4.5 stars in gold, the text "128 reviews", and 2 sample review rows each with a circular avatar, name, stars, and one line of review text.

Footer: deep slate #0F172A background with four columns of white link text labeled "About", "For Sellers", "Support", "Legal".

[Add the closing style line from Section 3.]

## 7. Screen 3 (Browse / Search) — Content Spec (restyle to Modern SaaS)

A premium modern SaaS UI design mockup of an e-commerce marketplace search/browse page for "LocalBiz", desktop browser view, 16:9 aspect ratio, no browser chrome. [Add the style paragraph from Section 2.]

Top navbar: same as Screen 1.

Below navbar: a wide white rounded search bar with soft shadow, a grey magnifying glass icon and placeholder text "Search products, shops, categories...", with a solid emerald pill button "Search" attached to its right end. Below it a row of filter pill tags: "Home Food" (active — emerald background, white text), "Handicrafts", "Groceries", "Clothing" (white pills with grey outlines).

Left sidebar (~25% width): a white rounded panel titled "Filters" with sections — "Price Range" with a slider, "Category" with 5 checkbox rows, "Delivery" with 2 checkbox rows ("Same day", "Within 2 days").

Main area: text "128 results for 'pickle'" at top, then a 3x2 grid of 6 white rounded product cards with soft shadows, each with a product photo area, product name, a small shop name in grey, an amber #D97706 price in ₹, and a small emerald "Add" pill button. Sample product names: "Aaji's Homemade Mango Pickle", "Organic Turmeric Powder", "Handwoven Cotton Kurta", "Fresh Paneer 500g", "Wooden Serving Bowl", "Gudi Homemade Papad".

Footer: deep slate #0F172A background with four columns of white link text labeled "About", "For Sellers", "Support", "Legal".

[Add the closing style line from Section 3.]

## 8. Reusable Blocks for Remaining Screens (4–21)

For every remaining screen, build the prompt as: Screen title from Section 4 + style paragraph (Section 2) + these reusable blocks, then the screen-specific content.

**Standard navbar (customer screens 1–9, 15, 17, 19, 20):**
"Top navbar: white background with a subtle bottom shadow, left side a rounded emerald square app icon with a white shop glyph and text 'LocalBiz' in bold slate; center links 'Marketplace', 'Vendors', 'How It Works'; right side a white outlined pill button 'Become a Seller' and a solid emerald green pill button 'Login / Sign Up' (#10B981)."

**Standard footer:**
"Footer: deep slate #0F172A background with four columns of white link text labeled 'About', 'For Sellers', 'Support', 'Legal'."

**Product card block (used in Screens 3, 4, 11, 16):**
"White rounded product cards with soft shadows, each with a product photo area, product name, a small shop name in grey, an amber #D97706 price in ₹, and a small emerald 'Add' pill button."

**Sample shop / product data (reuse anywhere):**
- Shop: "Aaji's Kitchen" (home food), "Kumbhar Crafts" (handicrafts), "Green Basket Farm" (groceries), "Fabric Nest" (clothing)
- Products: "Aaji's Homemade Mango Pickle ₹299", "Organic Turmeric Powder ₹149", "Handwoven Cotton Kurta ₹1,299", "Fresh Paneer 500g ₹180", "Wooden Serving Bowl ₹499", "Gudi Homemade Papad ₹120"

**Screen-specific hints:**
- Screen 4 (Storefront): shop banner, shop name "Aaji's Kitchen" with verified badge, rating, tabs ("Products", "About", "Reviews"), product grid.
- Screen 5 (Cart): list of 3 cart items (image, name, shop, price, quantity stepper, remove link), order summary card (subtotal, delivery, total, emerald "Proceed to Checkout" pill button).
- Screen 6 (Checkout & Payment): two columns — left delivery address form + payment method options (UPI, Card, Cash on Delivery as selectable cards, UPI selected); right order summary card with items, totals, emerald "Place Order" pill button.
- Screen 7 (Order Confirmation): centered success state — large emerald checkmark circle, "Order Placed Successfully!", order ID "Order #LB-2451", small summary card, buttons "Track Order" (emerald) and "Continue Shopping" (outlined).
- Screen 8 (Orders/Tracking): list of past orders on the left, right panel with a vertical progress tracker for one order (Placed → Packed → Shipped → Delivered, with "Packed" highlighted) and order details card.
- Screen 9 (Auth): centered white rounded card, logo, tabs "Login" / "Sign Up" (Login active), fields "Email", "Password", emerald "Login" pill button, divider, button "Continue with Google".
- Screen 10 (Vendor Setup Wizard): multi-step wizard — left sidebar with steps 1-4 ("Shop Info" active, "Products", "Bank Details", "Go Live"), main form area with fields "Shop Name", "Category" dropdown, "Shop Description", emerald "Next" pill button.
- Screen 11 (Vendor Dashboard): sidebar navigation (Dashboard, Products, Orders, AI Assistant, Settings), main area with 4 stat cards ("Today's Sales ₹4,280", "Orders 12", "Products 24", "Rating 4.6"), a line chart card "Sales This Week", and a recent orders table.
- Screen 12 (Product Add/Edit): form with fields "Product Name", "Price ₹", "Category" dropdown, "Description" textarea, image upload box with "+ Add Photo", emerald "Save Product" pill button.
- Screen 13 (Vendor Orders): table of orders with columns Order ID, Customer, Items, Total, Status (badges: "New" emerald, "Packed" amber, "Delivered" teal), row action buttons "Accept" / "Reject".
- Screen 14 (AI Vendor Teaching Assistant — FLAGSHIP): split layout — left chat panel with AI assistant header "Business Coach" and a green AI avatar, sample conversation about pricing and photography tips, input box "Ask your AI business coach..."; right panel with "Lessons" list (e.g. "How to price your products", "Taking better product photos", "Writing good descriptions") and a progress card. This screen should look polished — it is the flagship feature.
- Screen 15 (Customer Profile): left profile card with avatar, name "Riya Sharma", email, buttons "Edit Profile", "My Addresses"; right sections "My Orders", "Wishlist", "Payment Methods".
- Screen 16 (Vendor Inventory): table of products with columns Photo, Name, Price, Stock, Status (badges "In Stock" emerald / "Low Stock" amber / "Out of Stock" red), edit icons per row, emerald "+ Add Product" pill button.
- Screen 17 (Chat with Vendor): chat interface — left list of conversations (shop name, last message, time), right active chat with "Aaji's Kitchen" header, message bubbles (grey incoming, emerald outgoing), input box "Type a message...".
- Screen 18 (Admin Dashboard): dark sidebar or top admin bar "Admin", stat cards ("Users 1,240", "Vendors 86", "Orders 312", "GMS ₹8.4L"), table "Pending Vendor Approvals" with approve/reject buttons, bar chart "Orders by Category".
- Screen 19 (Reviews): product summary at top with large 4.5 stars and "128 reviews", rating breakdown bars (5★ 60%, 4★ 25%...), list of review cards (avatar, name, stars, date, review text, "Helpful" button).
- Screen 20 (Notifications): list of notification rows with icons (order update, price drop, new message), unread ones with an emerald dot and light background, tab filters "All", "Orders", "Promotions".
- Screen 21 (Vendor Shop Settings & Preview): two columns — left settings form (shop name, description, delivery radius, open/close toggle); right a live phone-style preview of the shop page inside a device frame labeled "Live Preview".

## 9. File Naming & Workflow

- Save each generated image in the `SCREENs` folder as `N_gemini.png` (N = screen number).
- Generate one screen at a time: prompt → generate → review → accept or regenerate with a targeted fix prompt (change ONLY the defect, keep everything else identical).
- Target: all 21 screens in the Modern SaaS style.
