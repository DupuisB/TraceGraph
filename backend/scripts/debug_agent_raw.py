import asyncio
import os

from mistralai import Mistral


async def debug_web_search():
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("MISTRAL_API_KEY not found")
        return

    client = Mistral(api_key=api_key)

    # Create temp agent
    agent = client.beta.agents.create(
        model="mistral-large-latest",
        name="Debug Agent",
        instructions=(
            "You are a helper. Search the web for the query and "
            "provide a detailed answer with citations."
        ),
        tools=[{"type": "web_search"}],
    )
    print(f"Created agent: {agent.id}")

    try:
        response = await client.beta.conversations.start_async(
            agent_id=agent.id,
            inputs=[
                {
                    "role": "user",
                    "content": (
                        "What is the current population of France? Please cite sources."
                    ),
                }
            ],
        )

        status_json = response.json()
        print(status_json)

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv()
    asyncio.run(debug_web_search())
