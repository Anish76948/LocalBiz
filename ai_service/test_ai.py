"""
Automated Verification Suite for LocalBiz AI Agent
Tests RAG knowledge queries, autonomous order placement, status tracking, and vendor fulfillment.
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from agent import agent
import json

def run_tests():
    print("==================================================")
    print("Testing LocalBiz AI Microservice Agent & Tools")
    print("==================================================\n")

    # Test 1: RAG Knowledge Query on Payments
    print("--- TEST 1: RAG Knowledge Query (Payment Options) ---")
    res1 = agent.process_message("How does payment work on LocalBiz? Does it support UPI?")
    print("Action Taken:", res1["action_taken"])
    print("Reply Preview:\n", res1["reply"][:250], "...\n")
    assert res1["action_taken"] == "KNOWLEDGE_RAG", "Test 1 Failed"

    # Test 2: RAG Knowledge Query on Pricing Formula for Artisans
    print("--- TEST 2: RAG Knowledge Query (Artisan Pricing Formula) ---")
    res2 = agent.process_message("How should I calculate the price of my handmade pottery?")
    print("Action Taken:", res2["action_taken"])
    print("Reply Preview:\n", res2["reply"][:250], "...\n")
    assert res2["action_taken"] == "KNOWLEDGE_RAG", "Test 2 Failed"

    # Test 3: Autonomous Order Placement
    print("--- TEST 3: Autonomous Order Placement via AI ---")
    res3 = agent.process_message("Please order Aaji mango pickle for Shoaib Khan at Flat 204 Bandra Mumbai")
    print("Action Taken:", res3["action_taken"])
    print("Reply:\n", res3["reply"], "\n")
    assert res3["action_taken"] == "AUTONOMOUS_ORDER_PLACED", "Test 3 Failed"
    created_order_number = res3["data"]["order_number"]
    print("Created Order Number:", created_order_number)

    # Test 4: Order Tracking via AI
    print("\n--- TEST 4: Track Order Status via AI ---")
    res4 = agent.process_message(f"Where is my order #{created_order_number}?")
    print("Action Taken:", res4["action_taken"])
    print("Reply:\n", res4["reply"], "\n")
    assert res4["action_taken"] == "TRACK_ORDER", "Test 4 Failed"

    # Test 5: Vendor Fulfillment (Mark as Shipped via AI)
    print("--- TEST 5: Vendor Fulfillment (Mark Order as Shipped via AI) ---")
    res5 = agent.process_message(f"Mark order #{created_order_number} as shipped")
    print("Action Taken:", res5["action_taken"])
    print("Reply:\n", res5["reply"], "\n")
    assert res5["action_taken"] == "UPDATE_ORDER_STATUS", "Test 5 Failed"

    # Test 6: Verify status is now SHIPPED
    print("--- TEST 6: Verify Updated Status in Database ---")
    res6 = agent.process_message(f"Track order #{created_order_number}")
    print("New Status in DB:", res6["data"]["status"])
    assert res6["data"]["status"] == "SHIPPED", "Test 6 Failed"

    # Test 7: Marketplace Analytics
    print("\n--- TEST 7: Business Performance Analytics ---")
    res7 = agent.process_message("Show current total sales and orders analytics")
    print("Action Taken:", res7["action_taken"])
    print("Reply:\n", res7["reply"], "\n")
    assert res7["action_taken"] == "GET_ANALYTICS", "Test 7 Failed"

    print("==================================================")
    print("ALL 7 AI AGENT TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
