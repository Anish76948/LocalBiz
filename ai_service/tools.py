"""
LocalBiz AI Action Tools
Enables autonomous agentic actions: placing orders, status tracking, shipping fulfillment, and analytics.
Connects directly to the SQLite database and executes ACID transactions.
"""

import sqlite3
import os
import random
from typing import Dict, Any, List, Optional

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "localbiz.db"))


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def tool_search_catalog(query: str = "", category_slug: Optional[str] = None) -> List[Dict[str, Any]]:
    """Search products in the marketplace catalog."""
    conn = get_db_connection()
    try:
        sql = """
            SELECT p.*, v.name as vendor_name, v.location as vendor_location
            FROM products p
            LEFT JOIN vendors v ON p.vendor_id = v.id
            WHERE 1=1
        """
        params = []
        if category_slug and category_slug != "all":
            sql += " AND p.category_slug = ?"
            params.append(category_slug)
        if query:
            sql += " AND (p.name LIKE ? OR p.description LIKE ? OR v.name LIKE ?)"
            pat = f"%{query}%"
            params.extend([pat, pat, pat])

        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def tool_get_product_by_name(name_query: str) -> Optional[Dict[str, Any]]:
    """Find a specific product by approximate name."""
    products = tool_search_catalog(name_query)
    if products:
        return products[0]
    return None


def tool_place_order(
    customer_name: str,
    customer_phone: str,
    customer_address: str,
    items: List[Dict[str, Any]],
    payment_method: str = "UPI (AI Assistant Sandbox)"
) -> Dict[str, Any]:
    """Autonomous tool: Places a customer order directly into SQLite database."""
    if not customer_name or not customer_address or not items:
        raise ValueError("Missing customer_name, address, or items for order.")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Compute total
        total_amount = 0.0
        resolved_items = []
        for it in items:
            p_id = it.get("id") or it.get("product_id")
            p_name = it.get("name") or it.get("product_name")
            p_price = float(it.get("price", 0))
            p_qty = int(it.get("quantity", 1))

            if not p_price and (p_id or p_name):
                # Fetch price from DB
                if p_id:
                    cursor.execute("SELECT * FROM products WHERE id = ?", (p_id,))
                else:
                    cursor.execute("SELECT * FROM products WHERE name LIKE ?", (f"%{p_name}%",))
                prod = cursor.fetchone()
                if prod:
                    p_id = prod["id"]
                    p_name = prod["name"]
                    p_price = float(prod["price"])

            total_amount += p_price * p_qty
            resolved_items.append({
                "product_id": p_id,
                "product_name": p_name or "Artisan Product",
                "price": p_price,
                "quantity": p_qty,
                "image_url": it.get("image_url", "")
            })

        order_number = f"LB-{random.randint(1000, 9999)}"

        cursor.execute(
            """
            INSERT INTO orders (order_number, customer_name, customer_phone, customer_address, payment_method, total_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, 'PLACED')
            """,
            (order_number, customer_name, customer_phone or "+91 98000 00000", customer_address, payment_method, total_amount)
        )
        order_id = cursor.lastrowid

        for item in resolved_items:
            cursor.execute(
                """
                INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image_url)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (order_id, item["product_id"], item["product_name"], item["price"], item["quantity"], item["image_url"])
            )

        conn.commit()
        return {
            "success": True,
            "order_id": order_id,
            "order_number": order_number,
            "total_amount": total_amount,
            "status": "PLACED",
            "items_count": len(resolved_items),
            "message": f"Order {order_number} successfully placed on LocalBiz!"
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def tool_track_order(order_number: str) -> Optional[Dict[str, Any]]:
    """Autonomous tool: Fetches real-time status and delivery progression of an order."""
    clean_num = order_number.strip().upper().replace("#", "")
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE order_number = ? OR order_number = ?", (clean_num, f"LB-{clean_num}"))
        row = cursor.fetchone()
        if not row:
            # Try searching by id
            try:
                oid = int(clean_num)
                cursor.execute("SELECT * FROM orders WHERE id = ?", (oid,))
                row = cursor.fetchone()
            except ValueError:
                pass

        if not row:
            return None

        order_dict = dict(row)

        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_dict["id"],))
        items = [dict(it) for it in cursor.fetchall()]
        order_dict["items"] = items

        timeline = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"]
        curr_status = order_dict.get("status", "PLACED")
        order_dict["timeline_step"] = timeline.index(curr_status) + 1 if curr_status in timeline else 1
        return order_dict
    finally:
        conn.close()


def tool_update_order_status(order_identifier: str, new_status: str) -> Dict[str, Any]:
    """Autonomous tool: Allows vendor/system to progress order state (e.g. SHIPPED, DELIVERED)."""
    valid_statuses = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"]
    new_status = new_status.strip().upper()
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status '{new_status}'. Must be one of: {valid_statuses}")

    clean_num = order_identifier.strip().upper().replace("#", "")
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE orders 
            SET status = ? 
            WHERE order_number = ? OR order_number = ? OR id = ?
            """,
            (new_status, clean_num, f"LB-{clean_num}", clean_num)
        )
        if cursor.rowcount == 0:
            return {"success": False, "message": f"Order {order_identifier} not found in database."}

        conn.commit()
        return {
            "success": True,
            "order_identifier": order_identifier,
            "new_status": new_status,
            "message": f"Order {order_identifier} marked as {new_status} in SQLite."
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def tool_get_vendor_analytics() -> Dict[str, Any]:
    """Autonomous tool: Returns live marketplace business performance indicators."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) as cnt FROM products")
        total_products = cursor.fetchone()["cnt"]

        cursor.execute("SELECT count(*) as cnt FROM vendors")
        total_vendors = cursor.fetchone()["cnt"]

        cursor.execute("SELECT count(*) as cnt, COALESCE(SUM(total_amount), 0) as rev FROM orders")
        order_row = cursor.fetchone()
        total_orders = order_row["cnt"]
        total_revenue = order_row["rev"]

        cursor.execute("SELECT status, count(*) as cnt FROM orders GROUP BY status")
        status_breakdown = {row["status"]: row["cnt"] for row in cursor.fetchall()}

        return {
            "total_products": total_products,
            "total_vendors": total_vendors,
            "total_orders": total_orders,
            "total_revenue_inr": total_revenue,
            "status_breakdown": status_breakdown
        }
    finally:
        conn.close()
