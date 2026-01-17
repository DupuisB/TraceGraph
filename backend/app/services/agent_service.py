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
        Verifies a claim using the agent with web_search tool.
        Handles the tool call loop until we get a final response.
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

        messages: list = [{"role": "user", "content": prompt}]
        max_iterations = 10  # Prevent infinite loops

        try:
            for iteration in range(max_iterations):
                print(f"[DEBUG] Agent iteration {iteration + 1}")

                response = await self.client.agents.complete_async(
                    agent_id=agent_id,
                    messages=messages,  # type: ignore[arg-type]
                )

                choice = response.choices[0]
                finish_reason = choice.finish_reason
                message = choice.message
                content = message.content
                tool_calls = getattr(message, "tool_calls", None)

                print(f"[DEBUG] Finish reason: {finish_reason}")
                print(f"[DEBUG] Content: {content}")
                print(f"[DEBUG] Tool calls: {tool_calls}")

                # Handle content that might be a list or string
                content_str = ""
                if isinstance(content, str):
                    content_str = content
                elif content:
                    # Handle List[ContentChunk] - extract text
                    content_str = str(content)

                # If we have content and finish_reason is 'stop', we're done
                if finish_reason == "stop" and content_str:
                    cleaned_content = (
                        content_str.replace("```json", "").replace("```", "").strip()
                    )
                    if cleaned_content:
                        try:
                            return json.loads(cleaned_content)
                        except json.JSONDecodeError as je:
                            print(f"[ERROR] JSON parse error: {je}")
                            return {
                                "status": "needs_review",
                                "reason": f"Invalid JSON: {str(je)}",
                                "source_url": None,
                            }

                # If agent wants to use tools, add the assistant message
                # and continue (native tools are executed server-side)
                if tool_calls:
                    # Add assistant message with tool calls to history
                    tool_calls_data = [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in tool_calls
                    ]
                    messages.append(
                        {
                            "role": "assistant",
                            "content": content_str,
                            "tool_calls": tool_calls_data,
                        }
                    )  # type: ignore[arg-type]
                    # For native web_search, we don't need to provide tool results
                    # The agent handles this automatically - just continue
                    continue

                # If we got here with empty content and no tool calls, something
                # is wrong
                if not content and not tool_calls:
                    print("[ERROR] Empty response with no tool calls")
                    return {
                        "status": "needs_review",
                        "reason": "Agent returned empty response",
                        "source_url": None,
                    }

            # Max iterations reached
            print("[ERROR] Max iterations reached")
            return {
                "status": "needs_review",
                "reason": "Agent verification timed out",
                "source_url": None,
            }

        except Exception as e:
            print(f"Agent verification failed: {e}")
            return {
                "status": "needs_review",
                "reason": f"Agent error: {str(e)}",
                "source_url": None,
            }
