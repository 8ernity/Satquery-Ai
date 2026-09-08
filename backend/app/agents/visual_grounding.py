"""Agent 6: Visual Grounding — Highlights the image region supporting the answer."""

from __future__ import annotations

import numpy as np

from ..schemas.agents import ChangeRegion, GroundingResult
from ..schemas.trace import ExecutionTrace
from .base import AgentBase


class VisualGroundingAgent(AgentBase):
    """Agent 6: Identify and highlight the image region supporting the answer.

    Uses change detection regions, VQA attention, or saliency maps
    to produce bounding boxes and overlay masks.
    """

    AGENT_ID = 6
    AGENT_NAME = "Visual Grounding"

    async def ground(
        self,
        image: np.ndarray,
        answer_context: str,
        change_regions: list[ChangeRegion] | None = None,
        trace: ExecutionTrace | None = None,
    ) -> GroundingResult:
        """Generate visual grounding for the investigation answer."""
        if trace is None:
            from ..schemas.trace import ExecutionTrace
            trace = ExecutionTrace(investigation_id="inline")

        start = self._trace_start(trace, "Generating visual evidence grounding")

        regions: list[ChangeRegion] = []

        # If change regions exist, use them directly
        if change_regions:
            regions = change_regions
            description = (
                f"Highlighting {len(regions)} region(s) identified by "
                f"the change detection analysis."
            )
        else:
            # Saliency-based grounding: find the most visually significant region
            region = self._saliency_grounding(image)
            if region:
                regions = [region]
                description = "Region identified via visual saliency analysis."
            else:
                description = "No specific region could be identified for grounding."

        result = GroundingResult(
            regions=regions,
            description=description,
        )

        self._trace_complete(trace, start, f"Grounding: {len(regions)} region(s)", {
            "regions": len(regions),
            "method": "change_regions" if change_regions else "saliency",
        })

        return result

    def _saliency_grounding(self, image: np.ndarray) -> ChangeRegion | None:
        """Simple saliency-based region detection using color contrast."""
        try:
            if len(image.shape) == 3:
                gray = np.mean(image, axis=2)
            else:
                gray = image.astype(np.float32)

            # Compute local contrast as simple saliency
            mean_val = np.mean(gray)
            saliency = np.abs(gray - mean_val)

            # Threshold at mean + std
            threshold = np.mean(saliency) + np.std(saliency)
            salient_mask = (saliency > threshold).astype(np.uint8)

            # Find bounding box of salient region
            ys, xs = np.where(salient_mask)
            if len(xs) < 50:  # Too few pixels
                return None

            return ChangeRegion(
                bbox=[float(xs.min()), float(ys.min()),
                      float(xs.max()), float(ys.max())],
                change_type="salient_region",
                area_pixels=len(xs),
            )
        except Exception:
            return None
