# PRD: LocalBiz Complete Prototype Engineering & Security Hardening

## Overview
Transform LocalBiz into an enterprise-grade, fully functional, secure, and accessible e-commerce marketplace prototype for final year viva evaluation (Group 6: Anish & Aditi Khandge, TCET Mumbai).

## Master Task Checklist (Priority-Ordered)
### Phase 1: Authentication, Role-Based Access & Footer Polish
- [x] Task 1.1: Footer Clean-Up (Removed group credit, replaced with official brand copyright)
- [x] Task 1.2: Database Auth Schema (SQLite `users` table with salted password hashes & seed accounts: Aditi, Anish, Priya, Aaji)
- [x] Task 1.3: Backend Auth API & Security (Rate limiting via `authLimiter`, scrypt password hashing, `/api/auth/register` and `/api/auth/login`)
- [x] Task 1.4: Frontend Auth Types & API Client (`User` interface, `loginUser`, `registerUser`, `fetchUserOrders`)
- [x] Task 1.5: Auth Modal Component (`AuthModal.tsx` with Sign In, Sign Up, and 1-Click Viva Demo logins for Aditi & Priya)
- [x] Task 1.6: Navbar & App Integration (Profile avatar dropdown, auto-fill checkout, personal order filtering)

### Phase 2: Buyer Conversion & Wishlist
- [x] Task 2.1: Wishlist / Favorites System (Heart icons on product cards, localStorage persistence, toast feedback)
- [x] Task 2.2: Checkout Promo Code Engine (`VOCAL4LOCAL` flat ₹100 off, `ARTISAN10` 10% off with real-time bill deduction)

### Phase 3: AI Vendor Studio Tools
- [x] Task 3.1: "✨ AI Generate Description" assistant in Add Product Modal for artisans (powered by OpenRouter Space Bunny)

### Phase 4: Full Automated Verification
- [x] Task 4.1: Automated test suite verification `test_full_suite.js` (14/14 tests passing with zero failures)
