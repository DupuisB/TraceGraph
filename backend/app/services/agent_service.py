import json
import os

from mistralai import Mistral

from app.exceptions import ConstructionError


class AgentService:
    def __init__(self):
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ConstructionError("MISTRAL_API_KEY not found in environment")
        self.client = Mistral(api_key=api_key)
        self.model = "mistral-large-latest"
        self.agent_name = "TraceGraph Auditor V2"

    async def get_or_create_auditor_agent(self) -> str:
        """
        Retrieves the Auditor Agent ID, or creates it if it doesn't exist.
        """
        # List existing agents (Beta API for management)
        # Passing page_size and metadata={} to avoid SDK UNSET bug
        agents = await self.client.beta.agents.list_async(page_size=100, metadata={})

        for agent in agents:
            if agent.name == self.agent_name:
                return agent.id

        # Create if not found
        instructions = (
            "You are a strict Logic & Fact Auditor for the TraceGraph system.\n"
            "YOUR GOAL: Verify if the User's Claim is true or false.\n\n"
            "TOOLS:\n- You have access to the 'web_search' tool.\n\n"
            "PROCESS:\n"
            "1. If the claim is logical, verify internal consistency.\n"
            "2. If it references external facts, USE THE WEB_SEARCH TOOL.\n"
            "3. Compare the Claim against the Evidence found.\n\n"
            "OUTPUT FORMAT:\n"
            "Return a JSON object:\n"
            "{\n"
            '  "status": "verified" | "refuted" | "needs_review",\n'
            '  "reason": "Brief explanation citing the source.",\n'
            '  "quote": "Exact quote from the web result or text context.",\n'
            '  "source_url": "The exact URL of the primary evidence used. "\n'
            '                "MUST be filled if web_search was used."\n'
            "}"
        )

        created_agent = await self.client.beta.agents.create_async(
            model=self.model,
            name=self.agent_name,
            instructions=instructions,
            tools=[{"type": "web_search"}],
            description="Agent that checks claims using logic and web search.",
        )
        return created_agent.id

    async def verify_claim_with_agent(self, claim_text: str, context: str = "") -> dict:
        """
        Verifies a claim triggers the agent.
        """
        agent_id = await self.get_or_create_auditor_agent()

        prompt = f"""
Context: {context}

Claim to verify: {claim_text}

IMPORTANT: You MUST return ONLY a valid JSON object with this exact structure:
{{
  "status": "verified" | "refuted" | "needs_review",
  "reason": "Brief explanation",
  "quote": "Exact quote from source",
  "source_url": "URL if web_search was used, otherwise null"
}}

Do not include any text before or after the JSON. Do not wrap it in markdown
code blocks.
"""

        try:
            # Use the main agents client for completion
            response = await self.client.agents.complete_async(
                agent_id=agent_id,
                messages=[{"role": "user", "content": prompt}],
            )

            content = response.choices[0].message.content

            # Debug logging
            print(f"[DEBUG] Agent raw response type: {type(content)}")
            print(f"[DEBUG] Agent raw response: {content}")

            if isinstance(content, str):
                cleaned_content = (
                    content.replace("```json", "").replace("```", "").strip()
                )

                if not cleaned_content:
                    print("[ERROR] Agent returned empty string")
                    return {
                        "status": "needs_review",
                        "reason": "Agent returned empty response",
                        "source_url": None,
                    }

                try:
                    return json.loads(cleaned_content)
                except json.JSONDecodeError as je:
                    print(f"[ERROR] JSON parse error: {je}")
                    print(f"[ERROR] Cleaned content: {cleaned_content}")
                    return {
                        "status": "needs_review",
                        "reason": f"Agent returned invalid JSON: {str(je)}",
                        "source_url": None,
                    }

            return {
                "status": "needs_review",
                "reason": "Agent returned non-string content",
                "source_url": None,
            }

        except Exception as e:
            print(f"Agent verification failed: {e}")
            return {
                "status": "needs_review",
                "reason": f"Agent error: {str(e)}",
                "source_url": None,
            }
