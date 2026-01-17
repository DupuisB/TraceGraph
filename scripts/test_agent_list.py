import asyncio
import os
from dotenv import load_dotenv, find_dotenv
from mistralai import Mistral

load_dotenv(find_dotenv())


async def test_list():
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("No API KEY")
        return

    client = Mistral(api_key=api_key)

    print("Listing agents...")
    try:
        # Replicating the fix: passing page_size
        # Trying to pass metadata=None to avoid UNSET error
        agents = await client.beta.agents.list_async(
            page_size=100, metadata={}
        )  # or None? Try empty dict
        # Note: agents is List[Agent], not object with .data (based on Pyright feedback earlier)
        print(f"Success! Found {len(agents.data)} agents.")
    except AttributeError:
        # Double check if it is .data or list
        print(f"Success! Found {len(agents)} agents (Direct list).")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_list())
