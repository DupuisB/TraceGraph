"""
AgentService: Mistral Agents API integration for factual verification.

Uses the native web_search tool to verify claims against live web data,
solving the "stale knowledge" limitation of standard LLM calls.
"""

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
            instructions="""You are a strict Fact Auditor with web search capabilities.

Your task is to verify factual claims by searching the web for evidence.

### Instructions:
1. Use web_search to find recent, authoritative sources.
2. Compare the claim against retrieved information.
3. Return a JSON verdict with citations.

### Response Format (JSON):
{
  "status": "verified | refuted | needs_review",
  "reason": "Brief explanation with evidence",
  "sources_used": ["url1", "url2"]
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

Original Context (for reference): {context[:500] if context else "None provided"}

Search the web and provide your verdict as JSON."""

        try:
            response = self.client.beta.conversations.start(
                agent_id=agent_id,
                inputs=prompt,
            )

            # Parse the response entries
            # Note: Beta API types are incomplete, using type: ignore
            citations: list[dict] = []
            final_text = ""

            for entry in response.entries:  # type: ignore[attr-defined]
                if entry.type == "message.output":
                    for chunk in entry.content:
                        if chunk.type == "text":
                            final_text += chunk.text
                        elif chunk.type == "tool_reference":
                            citations.append(
                                {
                                    "title": getattr(chunk, "title", ""),
                                    "url": getattr(chunk, "url", ""),
                                    "source": getattr(chunk, "source", ""),
                                }
                            )

            # Parse JSON from response
            import json

            try:
                # Try to extract JSON from the response
                json_start = final_text.find("{")
                json_end = final_text.rfind("}") + 1
                if json_start != -1 and json_end > json_start:
                    result_data = json.loads(final_text[json_start:json_end])
                else:
                    result_data = {"status": "needs_review", "reason": final_text}
            except json.JSONDecodeError:
                result_data = {"status": "needs_review", "reason": final_text}

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
