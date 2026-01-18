"""
Manual Test Script: Compare Web Search vs Non-Web Search Verification

This script tests the /analyze endpoint with text that requires external
fact-checking. Run twice: once with ENABLE_WEB_SEARCH=true, once with false.

Usage:
    # With web search enabled (set in .env):
    uv run python scripts/test_web_search.py

    # Override to disable:
    ENABLE_WEB_SEARCH=false uv run python scripts/test_web_search.py
"""

import os
import time

import httpx
from dotenv import load_dotenv

# Load .env file to get ENABLE_WEB_SEARCH setting
load_dotenv()

BASE_URL = "http://127.0.0.1:8000"

# This text contains factual claims that require web search to verify
TEST_TEXT = """
The following are key facts about AI developments in 2025:

1. OpenAI released GPT-5 in March 2025, outperforming previous models.
2. Anthropic's Claude 4 launched in early 2025 with improved reasoning.
3. The global AI market is expected to reach $500 billion by end of 2025.
4. France announced a 10 billion euro investment in AI research.
5. Mistral AI became Europe's most valuable AI startup at 6 billion dollars.

These developments mark a significant shift in the AI landscape.
"""


def test_analyze_and_poll():
    """Submit text for analysis and poll for verification results."""
    web_search_enabled = os.getenv("ENABLE_WEB_SEARCH", "false").lower() == "true"
    print(f"\n{'=' * 60}")
    print(f"Testing with ENABLE_WEB_SEARCH = {web_search_enabled}")
    print(f"{'=' * 60}\n")

    # 1. Submit for analysis
    print("--> Submitting text for analysis...")
    response = httpx.post(
        f"{BASE_URL}/analyze",
        json={"text_blob": TEST_TEXT},
        timeout=60.0,
    )

    if response.status_code != 200:
        print(f"ERROR: {response.status_code} - {response.text}")
        return

    data = response.json()
    graph = data["graph_structure"]
    root_id = graph["root_claim_id"]

    print(f"    Graph ID: {root_id}")
    print(f"    Nodes: {len(graph['nodes'])}")
    print(f"    Edges: {len(graph['edges'])}")

    # 2. Poll for verification results
    print("\n--> Polling for verification results...")
    max_polls = 20
    poll_interval = 2.0

    for i in range(max_polls):
        time.sleep(poll_interval)
        poll_response = httpx.get(f"{BASE_URL}/graph/{root_id}", timeout=30.0)

        if poll_response.status_code != 200:
            print(f"    Poll {i + 1}: ERROR {poll_response.status_code}")
            continue

        poll_data = poll_response.json()
        nodes = poll_data["nodes"]

        # Count verification statuses
        statuses = {}
        for node in nodes:
            if node["type"] == "claim":
                status = node.get("verification_status", "pending")
                statuses[status] = statuses.get(status, 0) + 1

        print(f"    Poll {i + 1}: {statuses}")

        # Check if all claims are verified (no pending)
        if statuses.get("pending", 0) == 0:
            print("\n    All claims verified!")
            break
    else:
        print("\n    WARNING: Timeout - some claims may still be pending")

    # 3. Print detailed results
    print(f"\n{'=' * 60}")
    print("VERIFICATION RESULTS")
    print(f"{'=' * 60}\n")

    for node in poll_data["nodes"]:
        if node["type"] != "claim":
            continue

        status = node.get("verification_status", "pending")
        reason = node.get("verification_reason", "")
        quote = node.get("verification_quote", "")
        citations = node.get("citations", [])

        status_icon = {
            "verified": "✅",
            "refuted": "❌",
            "needs_review": "👁️",
            "pending": "⏳",
        }.get(status, "❓")

        print(f"{status_icon} [{status.upper()}] {node['text'][:60]}...")
        if reason:
            print(f"   Reason: {reason[:100]}...")
        if quote:
            print(f'   Quote: "{quote[:80]}..."')
        if citations:
            print(f"   Citations ({len(citations)}):")
            for c in citations[:3]:
                print(f"     - {c.get('title', 'No title')[:50]}")
                print(f"       {c.get('url', 'No URL')[:60]}")
        print()


if __name__ == "__main__":
    test_analyze_and_poll()
