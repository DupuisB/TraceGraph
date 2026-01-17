"""
VerificationOrchestrator: Unified verification pipeline.

Routes claims through the appropriate verification path:
1. Classify claim (logic vs fact) using ClaimRouter
2. Logic claims -> MistralService.verify_claim
3. Fact claims -> AgentService.verify_claim_with_web
"""

from app.schemas.graph import Citation, Node, VerificationStatus
from app.services.agent_service import AgentService
from app.services.claim_router import ClaimRouter, ClaimType
from app.services.mistral_service import MistralService


class VerificationOrchestrator:
    """Orchestrates claim verification through the appropriate service."""

    def __init__(
        self,
        mistral_service: MistralService,
        agent_service: AgentService | None = None,
        enable_web_search: bool = False,
    ) -> None:
        """Initialize the orchestrator.

        Args:
            mistral_service: Service for logic-based verification.
            agent_service: Service for web-based fact verification.
            enable_web_search: Whether to enable web search for facts.
        """
        self.mistral_service = mistral_service
        self.agent_service = agent_service
        self.router = ClaimRouter() if enable_web_search else None
        self.enable_web_search = enable_web_search

    async def verify_claim(self, claim: Node, context: str) -> None:
        """Verify a single claim, updating its status in place.

        Args:
            claim: The Node to verify (modified in place).
            context: The original text context.
        """
        claim_type = ClaimType.LOGIC

        # Route the claim if web search is enabled
        if self.enable_web_search and self.router:
            claim_type, confidence = await self.router.classify_claim(claim.text)

            # Only use web search if confidence is high enough
            if confidence < 0.7:
                claim_type = ClaimType.LOGIC

        # Dispatch to appropriate verifier
        if claim_type == ClaimType.FACT and self.agent_service:
            result = await self.agent_service.verify_claim_with_web(claim.text, context)

            # Map citations
            claim.citations = [
                Citation(
                    title=c.get("title", ""),
                    url=c.get("url", ""),
                    source=c.get("source", ""),
                )
                for c in result.get("citations", [])
            ]
        else:
            # Default: logic-based verification
            result = await self.mistral_service.verify_claim(claim.text, context)

        # Update claim status
        status_str = result.get("status", "needs_review").lower()
        try:
            claim.verification_status = VerificationStatus(status_str)
        except ValueError:
            claim.verification_status = VerificationStatus.NEEDS_REVIEW

        claim.verification_reason = result.get("reason", "")
        claim.verification_quote = result.get("quote")

        print(
            f"    - Verified '{claim.id}': {claim.verification_status} "
            f"(via {claim_type}, {len(claim.citations)} citations)"
        )
