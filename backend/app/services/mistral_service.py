import json
import os

from mistralai import Mistral

from app.exceptions import ConstructionError
from app.prompts.architect import ARCHITECT_PROMPT
from app.schemas.graph import AnalysisResponse


def clean_json_string(s: str) -> str:
    """Cleans Mistral response to ensure valid JSON."""
    return s.replace("```json", "").replace("```", "").strip()


class MistralService:
    def __init__(self):
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            # In a real app we'd raise an error earlier, but for now:
            raise ConstructionError("MISTRAL_API_KEY not found in environment")
        self.client = Mistral(api_key=api_key)
        self.model = "mistral-large-latest"

    async def analyze_text(self, text: str) -> AnalysisResponse:
        """Analyzes text using Mistral Large and returns a structured graph."""
        prompt = ARCHITECT_PROMPT.format(text=text)

        try:
            chat_response = await self.client.chat.complete_async(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )

            content = chat_response.choices[0].message.content
            if not isinstance(content, str):
                raise ConstructionError(
                    f"Mistral returned unexpected content type: {type(content)}"
                )

            if not content:
                raise ConstructionError("Mistral returned an empty response")

            data = json.loads(clean_json_string(content))
            return AnalysisResponse(**data)

        except Exception as e:
            if isinstance(e, ConstructionError):
                raise e
            raise ConstructionError(f"Failed to extract graph: {str(e)}") from e

    async def verify_claim(self, claim_text: str, context: str = "") -> dict:
        """Verifies a claim using Mistral Small."""
        from app.prompts.auditor import AUDITOR_PROMPT

        prompt = AUDITOR_PROMPT.format(claim_text=claim_text, context=context)

        try:
            # Using mistral-small for verification as per plan
            response = await self.client.chat.complete_async(
                model="mistral-small-latest",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            content = response.choices[0].message.content
            if not isinstance(content, str) or not content:
                return {"status": "uncertain", "reason": "Empty response from verifier"}

            return json.loads(clean_json_string(content))
        except Exception as e:
            print(f"Verification error: {e}")
            return {"status": "uncertain", "reason": f"Verification failed: {str(e)}"}
