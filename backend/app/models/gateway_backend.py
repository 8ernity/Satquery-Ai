"""AI Gateway backend — routes VLM requests through FreeLLMAPI or OmniRoute."""

from __future__ import annotations

import base64
import io
import time

import numpy as np
from PIL import Image

from ..core.config import settings
from ..core.logging import get_logger
from .base import VLMBackend, VLMResponse

logger = get_logger("models.gateway")


class GatewayBackend(VLMBackend):
    """Vision-Language Model serving via FreeLLMAPI or OmniRoute gateway.

    Uses the OpenAI-compatible API to send image+text prompts to VLMs
    available through the configured gateway.
    """

    def __init__(self) -> None:
        self._base_url = settings.openai_base_url
        self._api_key = settings.openai_api_key
        self._model = settings.vlm_model_name
        self._client = None

    async def _get_client(self):
        """Lazy-init the OpenAI async client."""
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(
                base_url=self._base_url,
                api_key=self._api_key,
            )
        return self._client

    def _encode_image(self, image: np.ndarray) -> str:
        """Convert numpy array to base64-encoded PNG."""
        if image.dtype != np.uint8:
            # Normalize to 0-255
            img_min, img_max = image.min(), image.max()
            if img_max > img_min:
                image = ((image - img_min) / (img_max - img_min) * 255).astype(np.uint8)
            else:
                image = np.zeros_like(image, dtype=np.uint8)

        pil_img = Image.fromarray(image)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    async def answer_question(
        self,
        image: np.ndarray,
        question: str,
        context: str = "",
    ) -> VLMResponse:
        """Answer a question about an image via the gateway."""
        start = time.time()
        client = await self._get_client()

        system_prompt = (
            "You are a remote-sensing image analysis expert. "
            "Answer questions about satellite imagery accurately and concisely. "
            "If you are uncertain, say so explicitly."
        )
        if context:
            system_prompt += f"\n\nAdditional context: {context}"

        img_b64 = self._encode_image(image)

        try:
            response = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": question},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{img_b64}"},
                            },
                        ],
                    },
                ],
                max_tokens=512,
                temperature=0.1,
            )

            answer = response.choices[0].message.content or ""
            latency = (time.time() - start) * 1000

            return VLMResponse(
                answer=answer,
                raw_output=answer,
                model_name=self._model,
                model_version="gateway",
                tokens_used=response.usage.total_tokens if response.usage else 0,
                latency_ms=latency,
            )

        except Exception as e:
            logger.error("gateway_vlm_error", error=str(e), model=self._model)
            return VLMResponse(
                answer=f"Model inference failed: {str(e)}",
                model_name=self._model,
                model_version="gateway-error",
                latency_ms=(time.time() - start) * 1000,
            )

    async def generate_caption(
        self,
        image: np.ndarray,
        style: str = "detailed",
    ) -> VLMResponse:
        """Generate a caption for satellite imagery."""
        prompt = (
            "Describe this satellite image in detail. "
            "Include information about land cover, structures, water bodies, "
            "vegetation, and any notable features visible."
        )
        if style == "brief":
            prompt = "Briefly describe this satellite image in one sentence."
        return await self.answer_question(image, prompt)

    async def analyze_change(
        self,
        image_before: np.ndarray,
        image_after: np.ndarray,
        question: str = "What changed between these two images?",
    ) -> VLMResponse:
        """Analyze temporal change. Sends both images side-by-side."""
        # Concatenate before/after horizontally for single-image VLMs
        h = min(image_before.shape[0], image_after.shape[0])
        w1, w2 = image_before.shape[1], image_after.shape[1]

        combined = np.zeros((h, w1 + w2 + 10, 3), dtype=np.uint8)
        combined[:h, :w1] = image_before[:h, :w1]
        combined[:h, w1 + 10:] = image_after[:h, :w2]

        context = (
            "The image shows a before (left) and after (right) satellite view "
            "of the same area at different dates."
        )
        return await self.answer_question(combined, question, context=context)

    async def health_check(self) -> dict:
        """Check gateway connectivity."""
        try:
            client = await self._get_client()
            models = await client.models.list()
            return {
                "status": "healthy",
                "backend": "gateway",
                "base_url": self._base_url,
                "model": self._model,
                "available_models": len(models.data) if models.data else 0,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "backend": "gateway",
                "error": str(e),
            }

    @property
    def backend_name(self) -> str:
        return f"AI Gateway ({self._base_url})"
