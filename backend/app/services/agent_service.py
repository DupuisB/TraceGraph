"""
AgentService: Mistral Agents API integration for factual verification.

Uses the native web_search tool to verify claims against live web data,
solving the "stale knowledge" limitation of standard LLM calls.

API Reference:
- Agents: https://docs.mistral.ai/api/endpoint/beta/agents
- Conversations: https://docs.mistral.ai/api/endpoint/beta/conversations
- Web Search: https://docs.mistral.ai/agents/tools/built-in/websearch
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
    """Service for creating and managing Mistral Agents with web search.

    Uses the Mistral Beta Agents API to create an agent with web_search
    capability for fact verification.
    """

    def __init__(self) -> None:
        """Initialize the AgentService with Mistral client."""
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY not found in environment")
        self.client = Mistral(api_key=api_key)
        self._agent_id: str | None = None

    async def _ensure_agent_exists(self) -> str:
        """Create or retrieve the Auditor Agent.

        Returns:
            The agent ID for the TraceGraph Fact Auditor.
        """
        if self._agent_id:
            return self._agent_id

        # Create agent with web_search tool (Beta API)
        # Ref: https://docs.mistral.ai/api/endpoint/beta/agents
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
            # Start conversation with agent (Beta API)
            # Ref: https://docs.mistral.ai/api/endpoint/beta/conversations
            response = self.client.beta.conversations.start(
                agent_id=agent_id,
                inputs=prompt,
            )

            # Parse response.outputs list
            # Contains: ToolExecutionEntry, MessageOutputEntry
            citations: list[dict] = []
            final_text = ""

            for output in response.outputs:
                output_type = getattr(output, "type", "")

                if output_type == "message.output":
                    # MessageOutputEntry.content is a list of chunks
                    content_list = getattr(output, "content", [])

                    for chunk in content_list:
                        chunk_class = type(chunk).__name__

                        # ToolReferenceChunk - contains citation info
                        if chunk_class == "ToolReferenceChunk":
                            url = getattr(chunk, "url", "")
                            title = getattr(chunk, "title", "")
                            if url:
                                citations.append(
                                    {
                                        "title": title or "Source",
                                        "url": url,
                                        "source": getattr(chunk, "description", ""),
                                    }
                                )
                        # TextChunk - contains text content
                        elif chunk_class == "TextChunk":
                            text = getattr(chunk, "text", "")
                            if text:
                                final_text += text
                        # Handle plain strings (streaming chars)
                        elif isinstance(chunk, str):
                            final_text += chunk
                        # Fallback: check for url/text attributes
                        elif hasattr(chunk, "url"):
                            citations.append(
                                {
                                    "title": getattr(chunk, "title", "Source"),
                                    "url": getattr(chunk, "url", ""),
                                    "source": getattr(chunk, "source", ""),
                                }
                            )
                        elif hasattr(chunk, "text"):
                            text = getattr(chunk, "text", "")
                            if text:
                                final_text += text

            # Parse JSON verdict from response text
            try:
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
