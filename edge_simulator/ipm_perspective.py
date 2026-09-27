"""
Edge Inverse Perspective Mapping (IPM) Module
SIH Problem Statement 26124: Mobile Urban Intelligence Platform

Solves oblique camera angle perspective distortion (15°-35° pitch on public transit buses).
Maps 2D pixel bounding boxes (u, v) to ground-plane metric coordinates (X, Y) in meters
using camera intrinsic matrix K, mounting height h_cam, and pitch angle theta_pitch.
"""

import math
import numpy as np

class InversePerspectiveMapper:
    def __init__(self, camera_height=2.4, pitch_deg=22.0, focal_length_px=800.0, image_size=(1280, 720)):
        """
        Parameters:
            camera_height (float): Height of dashcam from road surface in meters (e.g. 2.4m for bus)
            pitch_deg (float): Downward pitch angle in degrees (e.g. 22.0°)
            focal_length_px (float): Focal length in pixels
            image_size (tuple): (width, height) of camera resolution in pixels
        """
        self.h = camera_height
        self.pitch = math.radians(pitch_deg)
        self.f = focal_length_px
        self.width, self.height = image_size
        self.u0 = self.width / 2.0
        self.v0 = self.height / 2.0

        # Construct Homography Matrix H mapping (u, v, 1)^T -> (X, Y, 1)^T on road plane
        self.H_ipm = self._compute_homography()

    def _compute_homography(self):
        """Computes homography transformation matrix from image plane to ground plane."""
        sin_p = math.sin(self.pitch)
        cos_p = math.cos(self.pitch)

        # Transformation matrix mapping image pixel (u,v) to ground coordinate (X, Y)
        # Y_ground (longitudinal distance forward from bus) = h * (f * cos_p - (v - v0) * sin_p) / (f * sin_p + (v - v0) * cos_p)
        # X_ground (lateral distance) = (u - u0) * sqrt(X_ground^2 + h^2) / f
        H = np.array([
            [1.0 / self.f, 0.0, -self.u0 / self.f],
            [0.0, sin_p / (self.h * cos_p), -self.v0 * sin_p / (self.h * cos_p)],
            [0.0, cos_p / (self.h * self.f), -self.v0 * cos_p / (self.h * self.f)]
        ])
        return H

    def pixel_to_ground(self, u, v):
        """
        Projects single pixel coordinate (u, v) to ground coordinate (X_meters, Y_meters).
        X: Lateral displacement (positive right, negative left)
        Y: Forward longitudinal distance from front bumper of bus
        """
        dy = v - self.v0
        sin_p = math.sin(self.pitch)
        cos_p = math.cos(self.pitch)

        denom = (self.f * sin_p + dy * cos_p)
        if abs(denom) < 1e-5:
            denom = 1e-5

        # Forward distance Y in meters
        Y_meters = self.h * (self.f * cos_p - dy * sin_p) / denom
        # Lateral offset X in meters
        dx = u - self.u0
        dist_hypot = math.sqrt(Y_meters**2 + self.h**2)
        X_meters = (dx * dist_hypot) / self.f

        return X_meters, max(0.5, Y_meters)

    def compute_metric_area_and_volume(self, bbox_pixels, mean_depth_m=0.08):
        """
        Calculates ground-plane un-warped metric area A_metric (m^2) and estimated defect volume V (m^3).

        Parameters:
            bbox_pixels (tuple): (u_min, v_min, u_max, v_max) in pixel coordinates
            mean_depth_m (float): Monocular depth estimation in meters (default 8 cm = 0.08m)

        Returns:
            dict: { 'area_m2': float, 'volume_m3': float, 'asphalt_kg': float, 'longitudinal_dist_m': float }
        """
        u_min, v_min, u_max, v_max = bbox_pixels

        # Transform 4 corner points of bounding box to ground plane coordinates
        x1, y1 = self.pixel_to_ground(u_min, v_min) # Top-left (further away)
        x2, y2 = self.pixel_to_ground(u_max, v_min) # Top-right
        x3, y3 = self.pixel_to_ground(u_max, v_max) # Bottom-right (closer to bus)
        x4, y4 = self.pixel_to_ground(u_min, v_max) # Bottom-left

        # Approximate quadrilateral area on ground plane (in meters^2)
        # Trapezoid metric width at top and bottom
        w_top = abs(x2 - x1)
        w_bottom = abs(x3 - x4)
        h_longitudinal = abs(y4 - y1)

        area_m2 = max(0.01, 0.5 * (w_top + w_bottom) * h_longitudinal)
        volume_m3 = area_m2 * mean_depth_m
        
        # Standard Asphalt Cold-Mix Density = ~2300 kg/m^3
        asphalt_kg = volume_m3 * 2300.0

        return {
            "area_m2": round(area_m2, 4),
            "volume_m3": round(volume_m3, 5),
            "asphalt_kg": round(asphalt_kg, 2),
            "longitudinal_dist_m": round(y4, 2)
        }

if __name__ == "__main__":
    ipm = InversePerspectiveMapper(camera_height=2.4, pitch_deg=22.0)
    # Test bounding box for a pothole near the bus vs far away
    res_far = ipm.compute_metric_area_and_volume((550, 420, 680, 480), mean_depth_m=0.07)
    res_near = ipm.compute_metric_area_and_volume((450, 580, 750, 690), mean_depth_m=0.07)
    print("Far Pothole Metric Calculation:", res_far)
    print("Near Pothole Metric Calculation:", res_near)
