"""Debug script to inspect web search response structure for citations."""

import os

from dotenv import load_dotenv
from mistralai import Mistral

load_dotenv()

client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))

# Create agent with web search
print("Creating agent...")
agent = client.beta.agents.create(
    model="mistral-medium-2505",
    name="Citation Debug Agent",
    description="Debug agent for inspecting citations",
    instructions="Search the web and answer questions. Include sources.",
    tools=[{"type": "web_search"}],
)
print(f"Agent ID: {agent.id}")

# Start conversation
print("\nStarting conversation...")
response = client.beta.conversations.start(
    agent_id=agent.id,
    inputs="Who won the 2024 Nobel Peace Prize? Cite your sources.",
)

print("\n=== Response ===")
print(f"Outputs count: {len(response.outputs)}")

for i, output in enumerate(response.outputs):
    print(f"\n--- Output {i} ---")
    print(f"Type: {getattr(output, 'type', 'N/A')}")

    if getattr(output, "type", "") == "tool.execution":
        print(f"Name: {getattr(output, 'name', 'N/A')}")
        # Check for info field that might contain search results
        info = getattr(output, "info", None)
        if info:
            print(f"Info: {type(info).__name__}")
            print(f"Info repr: {repr(info)[:500]}")

    if getattr(output, "type", "") == "message.output":
        content = getattr(output, "content", [])
        print(f"Content length: {len(content)}")

        # Analyze each unique chunk type
        chunk_types = {}
        for chunk in content:
            chunk_class = type(chunk).__name__
            chunk_types[chunk_class] = chunk_types.get(chunk_class, 0) + 1
        print(f"Chunk types: {chunk_types}")

        # Show first 5 non-string chunks
        non_str_count = 0
        for j, chunk in enumerate(content):
            if not isinstance(chunk, str):
                print(f"\n  Non-string chunk {j}: {type(chunk).__name__}")
                attrs = [a for a in dir(chunk) if not a.startswith("_")][:15]
                print(f"  Attributes: {attrs}")
                if hasattr(chunk, "url"):
                    print(f"  URL: {getattr(chunk, 'url', 'N/A')}")
                if hasattr(chunk, "title"):
                    print(f"  Title: {getattr(chunk, 'title', 'N/A')}")
                non_str_count += 1
                if non_str_count >= 5:
                    break

        if non_str_count == 0:
            # All strings - show first few chars of each
            print("\n  All chunks are strings. Sample:")
            sample = "".join(content[:20])
            print(f"  {sample[:200]}...")

# Cleanup
print("\n\nDeleting agent...")
client.beta.agents.delete(agent_id=agent.id)
print("Done!")
