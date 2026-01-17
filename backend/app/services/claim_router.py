"""
ClaimRouter: Classifies claims as 'logic' or 'fact' to determine verification path.

- Logic claims: Internal consistency (use MistralService)
- Fact claims: External data needed (use AgentService with web_search)
"""

import json
import os

from mistralai import Mistral


class ClaimType:
    LOGIC = "logic"
    FACT = "fact"


ROUTER_PROMPT = """Classify this claim as either "logic" or "fact".

- "logic": The claim is about reasoning, argument structure, or internal consistency.
  Examples: "Therefore X follows from Y", "This contradicts the earlier statement"
  
- "fact": The claim asserts something that requires external data to verify.
  Examples: "GDP grew 5% in 2024", "The CEO resigned in March", "Tesla stock hit $400"

Claim: {claim_text}

Respond with JSON: {{"type": "logic" | "fact", "confidence": 0.0-1.0}}
"""


class ClaimRouter:
    """Routes claims to appropriate verification service."""

    def __init__(self) -> None:
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY not found")
        self.client = Mistral(api_key=api_key)

    async def classify_claim(self, claim_text: str) -> tuple[str, float]:
        """Classify a claim as logic or fact.

        Args:
            claim_text: The claim to classify.

        Returns:
            Tuple of (claim_type, confidence).
        """
        prompt = ROUTER_PROMPT.format(claim_text=claim_text)

        try:
            # Use Mistral Small for fast classification
            response = await self.client.chat.complete_async(
                model="mistral-small-latest",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1,
            )

            content = response.choices[0].message.content
            if not content or not isinstance(content, str):
                return ClaimType.LOGIC, 0.5

            data = json.loads(content)
            claim_type = data.get("type", ClaimType.LOGIC)
            confidence = float(data.get("confidence", 0.5))

            # Validate claim type
            if claim_type not in [ClaimType.LOGIC, ClaimType.FACT]:
                claim_type = ClaimType.LOGIC

            print(
                f"    [Router] '{claim_text[:40]}' -> {claim_type} ({confidence:.2f})"
            )
            return claim_type, confidence

        except Exception as e:
            print(f"[Router] Classification error: {e}")
            # Default to logic (safer, doesn't incur web search costs)
            return ClaimType.LOGIC, 0.5
