"""
AgentService: Mistral Agents API integration for factual verification.

Uses the native web_search tool to verify claims against live web data,
solving the "stale knowledge" limitation of standard LLM calls.
"""

import json
import os
from typing import TypedDict

from mistralai import Mistral


class VerificationResult(TypedDict):
    """Result from the agent verification."""

    status: str  # verified | refuted | needs_review
    reason: str
    quote: str | None
    citations: list[dict]  # [{title, url, source}]


class AgentService:
    """Service for creating and managing Mistral Agents with web search."""

    def __init__(self) -> None:
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY not found in environment")
        self.client = Mistral(api_key=api_key)
        self._agent_id: str | None = None

    async def _ensure_agent_exists(self) -> str:
        """Create or retrieve the Auditor Agent."""
        if self._agent_id:
            return self._agent_id

        # Create the agent with web_search capability
        agent = self.client.beta.agents.create(
            model="mistral-medium-2505",
            name="TraceGraph Fact Auditor",
            description="Agent that verifies factual claims using web search.",
            instructions="""You are a strict Fact Auditor with web search.

Your task is to verify factual claims by searching the web for evidence.

### Instructions:
1. Use web_search to find recent, authoritative sources.
2. Compare the claim against retrieved information.
3. Return your verdict as JSON.

### Response Format (JSON only, no other text):
{
  "status": "verified" or "refuted" or "needs_review",
  "reason": "Brief explanation with evidence"
}
""",
            tools=[{"type": "web_search"}],
            completion_args={
                "temperature": 0.2,
                "top_p": 0.95,
            },
        )

        self._agent_id = agent.id
        print(f"--> [AgentService] Created Auditor Agent: {self._agent_id}")
        return self._agent_id

    async def verify_claim_with_web(
        self, claim_text: str, context: str = ""
    ) -> VerificationResult:
        """Verify a claim using the web search agent.

        Args:
            claim_text: The claim to verify.
            context: Optional context from the original text.

        Returns:
            VerificationResult with status, reason, and citations.
        """
        agent_id = await self._ensure_agent_exists()

        prompt = f"""Verify this claim using web search:

Claim: {claim_text}

Search the web and provide your verdict as JSON only."""

        try:
            response = self.client.beta.conversations.start(
                agent_id=agent_id,
                inputs=prompt,
            )

            # Parse the response outputs
            # response.outputs is a list of ToolExecutionEntry or MessageOutputEntry
            citations: list[dict] = []
            final_text = ""

            for output in response.outputs:
                # Check output type using the 'type' attribute
                output_type = getattr(output, "type", "")

                if output_type == "message.output":
                    # This is a MessageOutputEntry with content
                    content_list = getattr(output, "content", [])
                    for chunk in content_list:
                        chunk_type = getattr(chunk, "type", "")
                        if chunk_type == "text":
                            # TextChunk - extract the text
                            text = getattr(chunk, "text", "")
                            final_text += text
                        elif chunk_type == "tool_reference":
                            # Reference chunk from web search
                            citations.append(
                                {
                                    "title": getattr(chunk, "title", ""),
                                    "url": getattr(chunk, "url", ""),
                                    "source": getattr(chunk, "source", ""),
                                }
                            )

            # Parse JSON from response text
            try:
                # Try to extract JSON from the response
                json_start = final_text.find("{")
                json_end = final_text.rfind("}") + 1
                if json_start != -1 and json_end > json_start:
                    result_data = json.loads(final_text[json_start:json_end])
                else:
                    result_data = {
                        "status": "needs_review",
                        "reason": final_text[:500] if final_text else "No response",
                    }
            except json.JSONDecodeError:
                result_data = {
                    "status": "needs_review",
                    "reason": final_text[:500] if final_text else "Parse error",
                }

            return VerificationResult(
                status=result_data.get("status", "needs_review"),
                reason=result_data.get("reason", ""),
                quote=None,  # Web search doesn't have quotes from original
                citations=citations,
            )

        except Exception as e:
            print(f"[AgentService] Verification error: {e}")
            return VerificationResult(
                status="needs_review",
                reason=f"Web verification failed: {str(e)}",
                quote=None,
                citations=[],
            )
