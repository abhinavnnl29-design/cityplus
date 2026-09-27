"""
Shadow-Buster Edge Filter Module
SIH Problem Statement 26124: Mobile Urban Intelligence Platform

Evaluates candidate bounding box crop regions before event emission.
True road structural defects exhibit sharp 3D depth gradients and high Laplacian variance.
Optical tree, building, and bridge shadows exhibit low edge variance and smooth luminance transitions.
"""

import cv2
import numpy as np

def evaluate_shadow_artifact(roi_gray_or_bgr, variance_threshold=85.0):
    """
    Evaluates whether bounding box region is a soft optical shadow or genuine 3D defect.

    Parameters:
        roi_gray_or_bgr (np.ndarray): Image ROI of candidate bounding box crop
        variance_threshold (float): Minimum Laplacian variance threshold

    Returns:
        dict: { 'is_shadow': bool, 'laplacian_var': float, 'confidence_modifier': float }
    """
    if roi_gray_or_bgr is None or roi_gray_or_bgr.size == 0:
        return {"is_shadow": True, "laplacian_var": 0.0, "confidence_modifier": 0.0}

    if len(roi_gray_or_bgr.shape) == 3:
        roi_gray = cv2.cvtColor(roi_gray_or_bgr, cv2.COLOR_BGR2GRAY)
    else:
        roi_gray = roi_gray_or_bgr

    # Compute Laplacian variance (sharpness / edge gradient response)
    laplacian_var = float(cv2.Laplacian(roi_gray, cv2.CV_64F).var())

    is_shadow = laplacian_var < variance_threshold
    modifier = 0.2 if is_shadow else 1.0

    return {
        "is_shadow": is_shadow,
        "laplacian_var": round(laplacian_var, 2),
        "confidence_modifier": modifier
    }

if __name__ == "__main__":
    # Test on synthetic sharp patch vs uniform gray shadow patch
    sharp_patch = np.random.randint(0, 255, (100, 100), dtype=np.uint8)
    shadow_patch = np.ones((100, 100), dtype=np.uint8) * 60

    print("Sharp Defect ROI:", evaluate_shadow_artifact(sharp_patch))
    print("Optical Shadow ROI:", evaluate_shadow_artifact(shadow_patch))
