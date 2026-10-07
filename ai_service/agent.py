"""
LocalBiz AI Autonomous Agent & Teaching Assistant
Coordinates Intent Classification, RAG Knowledge Retrieval, and Direct Tool Execution.
"""

import re
import os
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from knowledge_base import retriever
import tools

# Load environment variables from .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


class LocalBizAgent:
    """Intelligent autonomous agent for LocalBiz marketplace and vendor coaching."""

    def __init__(self):
        self.name = "Bazaar Buddy (LocalBiz AI Assistant)"
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.model_name = os.getenv("OPENROUTER_MODEL", "stealth/space-bunny-alpha")

    def call_llm(self, prompt: str, system_context: str = "") -> Optional[str]:
        """Calls OpenRouter with Space Bunny Alpha model (1M context, 100% free)."""
        if not self.openrouter_key:
            return None
        try:
            headers = {
                "Authorization": f"Bearer {self.openrouter_key}",
                "Content-Type": "application/json"
            }
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are 'Bazaar Buddy', the flagship AI Business Coach and Assistant for LocalBiz—"
                        "a digital marketplace empowering Indian grassroots artisans, potters, home cooks, and weavers. "
                        "Keep your tone polite, encouraging, practical, and clear. Support both English and Hinglish seamlessly.\n"
                        f"{system_context}"
                    )
                },
                {"role": "user", "content": prompt}
            ]
            payload = {
                "model": self.model_name,
                "messages": messages
            }
            res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=15)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"].get("content")
                if content:
                    return content.strip()
        except Exception as e:
            print(f"LLM API error (falling back to deterministic response): {e}")
        return None

    def process_message(
        self,
        message: str,
        user_role: str = "customer",
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main Agent Decision Loop:
        1. Classify intent (Tracking, Shipping fulfillment, Order placement, Analytics, Knowledge RAG)
        2. Execute appropriate tool or RAG retrieval
        3. Formulate structured response with actionable next steps
        """
        msg = message.strip()
        msg_lower = msg.lower()

        # -------------------------------------------------------------
        # 1. INTENT: ORDER TRACKING
        # -------------------------------------------------------------
        # Matches e.g. "Track order LB-7453", "Where is my order #7453", "status of LB-1234"
        order_match = re.search(r"\b(?:lb-?)?(\d{4})\b", msg_lower)
        if any(w in msg_lower for w in ["track", "kahan", "status", "where is", "delivery", "kab"]) and order_match:
            order_id = order_match.group(1)
            order_data = tools.tool_track_order(order_id)
            if order_data:
                items_str = ", ".join([f"{it['product_name']} (×{it['quantity']})" for it in order_data.get("items", [])])
                timeline_stages = ["1. Placed (Order confirmed)", "2. Confirmed (Artisan preparing)", "3. Shipped (In transit)", "4. Delivered (Completed)"]
                curr_idx = order_data["timeline_step"] - 1

                reply = (
                    f"📦 **Order #{order_data['order_number']} Status Update**\n\n"
                    f"• **Current Stage:** **{order_data['status']}** ({timeline_stages[curr_idx]})\n"
                    f"• **Customer:** {order_data['customer_name']}\n"
                    f"• **Destination:** {order_data['customer_address']}\n"
                    f"• **Items:** {items_str or 'Handcrafted products'}\n"
                    f"• **Total Amount:** ₹{order_data['total_amount']} (Paid via {order_data['payment_method']})\n\n"
                    f"💡 *Note: Artisans pack fragile items with double corrugated protection and dispatch within 48 hours.*"
                )
                return {
                    "reply": reply,
                    "action_taken": "TRACK_ORDER",
                    "data": order_data
                }
            else:
                return {
                    "reply": f"⚠️ Could not find order number **#{order_id}** in our database. Please double check the 4-digit code (e.g., LB-1234).",
                    "action_taken": "TRACK_ORDER_FAILED",
                    "data": None
                }

        # -------------------------------------------------------------
        # 2. INTENT: VENDOR FULFILLMENT (MARK SHIPPED / DELIVERED)
        # -------------------------------------------------------------
        # Matches e.g. "Mark LB-7453 as shipped", "Ship order 7453", "Mark delivered"
        if any(w in msg_lower for w in ["ship", "delivered", "dispatch", "status badlo", "mark"]) and order_match:
            order_num = order_match.group(1)
            new_status = "DELIVERED" if "deliver" in msg_lower else "SHIPPED"
            res = tools.tool_update_order_status(order_num, new_status)

            if res["success"]:
                reply = (
                    f"✅ **Fulfillment Action Completed!**\n\n"
                    f"• **Order:** #{order_num}\n"
                    f"• **New Status:** **{new_status}**\n"
                    f"• **Database Sync:** Recorded in SQLite database.\n"
                    f"• **Customer View:** Customer's tracking timeline has been automatically updated to '{new_status}' in real-time."
                )
                return {
                    "reply": reply,
                    "action_taken": "UPDATE_ORDER_STATUS",
                    "data": res
                }
            else:
                return {
                    "reply": f"⚠️ {res['message']}",
                    "action_taken": "UPDATE_FAILED",
                    "data": res
                }

        # -------------------------------------------------------------
        # 3. INTENT: VENDOR BUSINESS ANALYTICS & KPIS
        # -------------------------------------------------------------
        # Matches e.g. "sales kitna hua", "revenue", "analytics", "how many orders", "stats"
        if any(w in msg_lower for w in ["sales", "revenue", "analytics", "earnings", "kpi", "kamai", "stats"]):
            analytics = tools.tool_get_vendor_analytics()
            reply = (
                f"📊 **LocalBiz Real-Time Marketplace Analytics**\n\n"
                f"• **Total Revenue (GMS):** ₹{analytics['total_revenue_inr']:,.2f}\n"
                f"• **Total Orders Processed:** {analytics['total_orders']}\n"
                f"• **Active Products Listed:** {analytics['total_products']}\n"
                f"• **Verified Artisan Studios:** {analytics['total_vendors']}\n\n"
                f"**Orders Breakdown by Status:**\n"
            )
            for st, cnt in analytics["status_breakdown"].items():
                reply += f"  - `{st}`: {cnt} order(s)\n"

            reply += "\n💡 *Tip: Fulfill all 'PLACED' orders within 48h to maintain a 5.0 Artisan Trust Rating.*"
            return {
                "reply": reply,
                "action_taken": "GET_ANALYTICS",
                "data": analytics
            }

        # -------------------------------------------------------------
        # 4. INTENT: AUTONOMOUS ORDER PLACEMENT (AGENTIC ACTION)
        # -------------------------------------------------------------
        # Matches e.g. "Order mango pickle for Aditi Sharma at Mumbai", "Buy 2 honey jars"
        order_triggers = ["buy", "khareed", "purchase", "place order", "order a", "order the", "order me", "please order"]
        if any(t in msg_lower for t in order_triggers) or (msg_lower.startswith("order ") and not any(w in msg_lower for w in ["track", "status", "ship"])):
            # Check what product is requested
            catalog = tools.tool_search_catalog()
            matched_product = None
            for prod in catalog:
                keywords = prod["name"].lower().split()
                if any(kw in msg_lower for kw in keywords if len(kw) > 3):
                    matched_product = prod
                    break

            # Default to mango pickle or tableware if not specified
            if not matched_product:
                if "pickle" in msg_lower or "aaji" in msg_lower:
                    matched_product = tools.tool_get_product_by_name("Pickle")
                elif "honey" in msg_lower:
                    matched_product = tools.tool_get_product_by_name("Honey")
                elif "cup" in msg_lower or "pottery" in msg_lower or "ceramic" in msg_lower:
                    matched_product = tools.tool_get_product_by_name("Ceramic")
                else:
                    matched_product = catalog[0] if catalog else None

            if matched_product:
                # Extract customer name if present, else use default
                customer_name = "Priya Customer"
                name_match = re.search(r"for\s+([A-Za-z\s]+?)(?:\s+at|\s+address|\s+phone|$)", msg, re.IGNORECASE)
                if name_match:
                    customer_name = name_match.group(1).strip()

                address = "Flat 102, Heritage Residency, Bandra West, Mumbai 400050"
                addr_match = re.search(r"at\s+([A-Za-z0-9\s,\.-]+)", msg, re.IGNORECASE)
                if addr_match:
                    address = addr_match.group(1).strip()

                order_res = tools.tool_place_order(
                    customer_name=customer_name,
                    customer_phone="+91 98201 44520",
                    customer_address=address,
                    items=[{
                        "product_id": matched_product["id"],
                        "name": matched_product["name"],
                        "price": matched_product["price"],
                        "quantity": 1,
                        "image_url": matched_product["image_url"]
                    }],
                    payment_method="UPI (AI Assistant Sandbox)"
                )

                reply = (
                    f"🎉 **Order Placed Successfully by LocalBiz AI Agent!**\n\n"
                    f"• **Order Number:** **#{order_res['order_number']}**\n"
                    f"• **Product:** {matched_product['name']} (₹{matched_product['price']})\n"
                    f"• **Customer:** {customer_name}\n"
                    f"• **Delivery Address:** {address}\n"
                    f"• **Payment Method:** UPI (Sandbox Simulated)\n\n"
                    f"You can track this live in the customer **'Track Orders'** modal or vendor portal using reference `#{order_res['order_number']}`."
                )
                return {
                    "reply": reply,
                    "action_taken": "AUTONOMOUS_ORDER_PLACED",
                    "data": order_res
                }

        # -------------------------------------------------------------
        # 5. INTENT: DOMAIN KNOWLEDGE RAG (PAYMENTS, SHIPPING, PRICING, VENDOR GUIDE)
        # -------------------------------------------------------------
        retrieved_docs = retriever.retrieve(msg, top_k=2)
        if retrieved_docs and retrieved_docs[0]["relevance_score"] > 0.4:
            top_doc = retrieved_docs[0]
            
            # Format context from retrieved documents
            context_blocks = "\n\n".join([f"[{d['title']}]:\n{d['content']}" for d in retrieved_docs])
            system_ctx = f"Reference Knowledge from LocalBiz Platform Docs:\n{context_blocks}"
            
            # Try LLM generation via Space Bunny Alpha
            llm_answer = self.call_llm(prompt=msg, system_context=system_ctx)
            if llm_answer:
                reply = llm_answer
            else:
                reply = (
                    f"📖 **{top_doc['title']}**\n\n"
                    f"{top_doc['content']}\n\n"
                )
                if len(retrieved_docs) > 1 and retrieved_docs[1]["relevance_score"] > 0.6:
                    reply += f"🔗 *Related Info ({retrieved_docs[1]['title']}):*\n{retrieved_docs[1]['content'][:180]}..."

            return {
                "reply": reply,
                "action_taken": "KNOWLEDGE_RAG",
                "data": {"retrieved_docs": retrieved_docs}
            }

        # -------------------------------------------------------------
        # 6. DEFAULT INTENT: GENERAL ASSISTANT / TEACHING COACH
        # -------------------------------------------------------------
        # Check if Space Bunny LLM can answer the open-ended question directly
        open_ended_answer = self.call_llm(
            prompt=msg,
            system_context="Assist the local artisan or buyer. Provide actionable, concise advice about Indian local commerce, marketing, craft techniques, or marketplace navigation."
        )

        if open_ended_answer:
            return {
                "reply": open_ended_answer,
                "action_taken": "LLM_OPEN_ASSISTANT",
                "data": {"status": "online"}
            }

        reply = (
            f"Namaste! I am **{self.name}**, your autonomous assistant for LocalBiz.\n\n"
            f"Here is what I can do for you right now:\n"
            f"1. 🛍️ **Place an Order:** Ask me *'Order Aaji mango pickle for Anish at Bandra'*\n"
            f"2. 📦 **Track an Order:** Ask *'Track order LB-7453'*\n"
            f"3. 🚚 **Vendor Fulfillment:** Tell me *'Mark order LB-7453 as Shipped'*\n"
            f"4. 📊 **Business Analytics:** Ask *'What is our total sales and orders count?'*\n"
            f"5. 💳 **Platform & Payment FAQs:** Ask about *'UPI payments'*, *'Return policy'*, or *'How to price my pottery'*."
        )
        return {
            "reply": reply,
            "action_taken": "ASSISTANT_INTRO",
            "data": None
        }


agent = LocalBizAgent()
