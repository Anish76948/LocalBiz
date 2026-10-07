"""
LocalBiz Domain Knowledge Base & Semantic Retrieval Engine (RAG)
Contains platform documentation, payment mechanisms, vendor guides, and policies.
"""

import math
import re
from typing import List, Dict, Any

KNOWLEDGE_DOCS = [
    {
        "id": "payments_overview",
        "category": "Payments",
        "title": "Payment Gateways & Methods on LocalBiz",
        "content": (
            "LocalBiz supports three primary payment options designed for Indian local commerce:\n"
            "1. UPI (GPay, PhonePe, Paytm, BHIM): Instant QR-based or VPA transfers with 0% transaction fee.\n"
            "2. Debit/Credit Cards & NetBanking: Processed securely via Razorpay/Stripe sandbox environments.\n"
            "3. Cash on Delivery (COD): Supported for trusted local pin codes to serve rural and elderly customers without digital wallets.\n"
            "In this sandbox prototype, no real money is deducted. All transactions simulate bank webhooks and immediately record payments as 'PAID' in the database."
        ),
        "tags": ["payment", "upi", "card", "stripe", "razorpay", "cod", "cash", "money", "gateway", "fees"]
    },
    {
        "id": "shipping_policy",
        "category": "Logistics",
        "title": "Shipping SLAs, Delivery Timelines, and Packaging",
        "content": (
            "Delivery Policies on LocalBiz:\n"
            "1. Dispatch Time: Artisans are required to pack and dispatch orders within 48 hours of order placement.\n"
            "2. Delivery Timeline: Local deliveries take 24-48 hours. Inter-city courier deliveries take 3-5 business days.\n"
            "3. Shipping Charges: Delivery is completely FREE on all orders of ₹500 or more. A nominal ₹50 fee is charged for orders below ₹500.\n"
            "4. Fragile Packaging: For ceramic pottery and glass pickle jars, artisans use biodegradable bubble wrap and double-walled corrugated boxes."
        ),
        "tags": ["shipping", "delivery", "dispatch", "courier", "charges", "free shipping", "timeline", "packaging", "fragile"]
    },
    {
        "id": "refunds_returns",
        "category": "Customer Support",
        "title": "7-Day Return, Replacement & Refund Policy",
        "content": (
            "LocalBiz Guarantee & Return Policy:\n"
            "1. Damaged Goods: If handcrafted pottery or glass jars arrive chipped or broken, customers receive an instant free replacement upon uploading a photo within 48 hours.\n"
            "2. 7-Day Return Window: Non-perishable items like handloom cotton shawls, brassware, and woodcraft can be returned within 7 days in unused condition.\n"
            "3. Perishable Food: Homemade pickles and fresh spices have a satisfaction guarantee. If the seal is broken or quality is unsatisfactory, a 100% refund is initiated within 3 working days."
        ),
        "tags": ["refund", "return", "replacement", "broken", "damaged", "policy", "guarantee", "cancel"]
    },
    {
        "id": "vendor_onboarding_guide",
        "category": "Vendor Guidance",
        "title": "How to Register and Open an Artisan Shop on LocalBiz",
        "content": (
            "Step-by-step Vendor Onboarding:\n"
            "1. Step 1 - Shop Profile: Provide your Studio/Kitchen name, physical city (e.g. Jaipur, Pune), and an artisan bio.\n"
            "2. Step 2 - Verification: LocalBiz verifies genuine local production to ensure no mass-manufactured Chinese goods are sold.\n"
            "3. Step 3 - Add First Product: Upload clear photos, set price in ₹, specify stock quantity, and write craft notes.\n"
            "4. Step 4 - Go Live: Once published, your storefront becomes accessible to all local customers immediately."
        ),
        "tags": ["vendor", "seller", "register", "onboard", "create shop", "open store", "artisan guide"]
    },
    {
        "id": "artisan_pricing_formula",
        "category": "Vendor Guidance",
        "title": "Intelligent Pricing Formula for Handmade & Organic Goods",
        "content": (
            "Recommended LocalBiz Pricing Formula for Artisans:\n"
            "Retail Price = (Raw Material Cost + Labor Time @ Fair Hourly Wage + Packaging Cost) × 1.30 (30% Profit Margin).\n"
            "Tips:\n"
            "- Ceramics: Factor in kiln electricity/firewood and glaze losses (typically 10% breakage rate).\n"
            "- Food & Pickles: Factor in seasonality (raw mangoes cost more off-season; preserve in bulk during harvest).\n"
            "- Handloom: Include spinning and loom setup time, which represents 40% of effort before weaving starts."
        ),
        "tags": ["pricing", "how to price", "profit", "margin", "cost", "calculation", "formula", "business advice"]
    },
    {
        "id": "order_fulfillment_steps",
        "category": "Vendor Operations",
        "title": "Vendor Order Lifecycle and Progression",
        "content": (
            "Order Status Machine on LocalBiz:\n"
            "1. PLACED: Customer completed sandbox checkout. The order appears in Vendor Portal under 'Recent Customer Orders'.\n"
            "2. CONFIRMED: Vendor acknowledges the order and starts preparing the handcrafted item.\n"
            "3. SHIPPED: Item packed and handed to courier. The vendor clicks 'Mark as Shipped' in the portal. Customer's tracking timeline immediately highlights SHIPPED.\n"
            "4. DELIVERED: Customer receives the parcel. Vendor or courier clicks 'Mark as Delivered'."
        ),
        "tags": ["order status", "lifecycle", "placed", "shipped", "delivered", "fulfillment", "mark shipped"]
    },
    {
        "id": "photography_guide",
        "category": "Vendor Guidance",
        "title": "Mobile Photography Tips for Low-Tech Artisans",
        "content": (
            "Product Photography Tips with a Basic Smartphone:\n"
            "1. Natural Daylight: Photograph your pottery or textiles next to a window in morning light (8 AM - 10 AM). Avoid direct harsh midday sunlight.\n"
            "2. Neutral Background: Use a plain white chart paper or a clean wooden surface. Avoid patterned tablecloths.\n"
            "3. Clean the Lens: Wipe your phone camera lens with a soft cotton cloth before taking shots.\n"
            "4. Multiple Angles: Take one full front shot, one close-up of the texture/weave, and one showing scale (e.g. cup next to a kettle)."
        ),
        "tags": ["photo", "photography", "camera", "lighting", "tips", "mobile", "how to take photo"]
    },
    {
        "id": "sdg_mission",
        "category": "About",
        "title": "LocalBiz Mission, UN SDGs, and Viksit Bharat 2047",
        "content": (
            "LocalBiz Mission & Institutional Background:\n"
            "- Final Year Engineering Project by Group 06: Anish & Aditi Khandge at TCET Mumbai.\n"
            "- SDG 1 (No Poverty): Empowering home-based micro-producers with direct digital market access.\n"
            "- SDG 8 (Decent Work & Economic Growth): Preserving traditional Indian crafts and supporting sustainable livelihoods.\n"
            "- Viksit Bharat @ 2047: Fostering technology-enabled grassroots entrepreneurship across Tier 2/3 cities and rural clusters."
        ),
        "tags": ["sdg", "mission", "group 6", "tcet", "viksit bharat", "about", "project"]
    }
]


class KnowledgeRetriever:
    """Lightweight BM25 / Keyword Re-ranking Engine for RAG queries."""

    def __init__(self, docs: List[Dict[str, Any]] = KNOWLEDGE_DOCS):
        self.docs = docs
        self.doc_tokens = [self._tokenize(d["title"] + " " + d["content"] + " " + " ".join(d["tags"])) for d in docs]
        self.num_docs = len(docs)
        self.avg_doc_len = sum(len(tokens) for tokens in self.doc_tokens) / max(1, self.num_docs)

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\w+", text.lower())

    def retrieve(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return self.docs[:top_k]

        scores = []
        for idx, doc_toks in enumerate(self.doc_tokens):
            score = 0.0
            doc_len = len(doc_toks)
            for token in query_tokens:
                tf = doc_toks.count(token)
                if tf > 0:
                    # BM25-style term weight
                    k1 = 1.2
                    b = 0.75
                    idf = math.log((self.num_docs + 1) / (1 + sum(1 for d in self.doc_tokens if token in d)))
                    term_score = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc_len / self.avg_doc_len))))
                    score += term_score
            scores.append((score, idx))

        scores.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, idx in scores[:top_k]:
            doc_copy = dict(self.docs[idx])
            doc_copy["relevance_score"] = round(score, 3)
            results.append(doc_copy)

        return results


retriever = KnowledgeRetriever()
