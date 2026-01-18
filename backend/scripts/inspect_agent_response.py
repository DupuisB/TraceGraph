"""Script to inspect Mistral Agents API response structure."""

import os

from dotenv import load_dotenv
from mistralai import Mistral

load_dotenv()

client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))

# Create a simple agent with web search
print("Creating agent...")
agent = client.beta.agents.create(
    model="mistral-medium-2505",
    name="Test Agent",
    description="Test agent for inspecting response structure",
    instructions="You can search the web. Answer briefly.",
    tools=[{"type": "web_search"}],
)

print(f"Agent ID: {agent.id}")

# Start a conversation
print("\nStarting conversation...")
response = client.beta.conversations.start(
    agent_id=agent.id, inputs="What is the current weather in Paris?"
)

print(f"\n=== Response Type: {type(response).__name__} ===")
print(f"Response fields: {response.model_fields.keys()}")
print(f"\n=== conversation_id: {response.conversation_id} ===")
print(f"\n=== outputs type: {type(response.outputs)} ===")
print(f"outputs length: {len(response.outputs)}")

for i, output in enumerate(response.outputs):
    print(f"\n--- Output {i} ---")
    print(f"Type: {type(output).__name__}")
    if hasattr(output, "model_fields"):
        print(f"Fields: {output.model_fields.keys()}")
    print(f"Dir: {[a for a in dir(output) if not a.startswith('_')][:15]}")

    # Try to access common attributes
    for attr in ["type", "content", "role", "name", "tool", "text", "message"]:
        if hasattr(output, attr):
            val = getattr(output, attr)
            print(f"  {attr}: {type(val).__name__} = {str(val)[:100]}")

# Cleanup
print("\n\nDeleting agent...")
client.beta.agents.delete(agent_id=agent.id)
print("Done!")
