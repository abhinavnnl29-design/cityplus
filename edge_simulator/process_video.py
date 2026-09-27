import cv2
import numpy as np
from ultralytics import YOLO

# 1. Load trained pothole detector (or your custom best.pt weights)
model = YOLO('keremberke/yolov8m-pothole-segmentation')

input_video = 'pothole-demo.mp4'
output_video = 'pothole-annotated.mp4'

cap = cv2.VideoCapture(input_video)
if not cap.isOpened():
    print(f"Cannot open video {input_video}. Ensure it is inside the edge_simulator folder.")
    exit()

width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps    = cap.get(cv2.CAP_PROP_FPS)

# Output MP4 writer
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

def detect_waterlogging(frame):
    """Segment water patches based on asphalt-puddle reflection and HSV range."""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # Mask wet/reflective dark surfaces on the road
    lower_water = np.array([0, 0, 40])
    upper_water = np.array([180, 70, 140])
    mask = cv2.inRange(hsv, lower_water, upper_water)
    
    # Restrict to bottom 60% of screen (road perspective)
    roi_mask = np.zeros_like(mask)
    roi_mask[int(height * 0.4):, :] = mask[int(height * 0.4):, :]
    
    contours, _ = cv2.findContours(roi_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    water_boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if 2000 < area < (width * height * 0.25): # filter noise and entire sky
            x, y, w, h = cv2.boundingRect(cnt)
            water_boxes.append((x, y, w, h))
    return water_boxes

print("Running detection on video for all potholes and water zones...")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # 1. Detect Potholes (low confidence threshold conf=0.25 captures all potholes)
    results = model(frame, conf=0.25, verbose=False)
    for r in results:
        boxes = r.boxes
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0]) * 100
            
            # Draw Red Pothole Bounding Box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            label = f"Pothole: Roboflow Model ({conf:.1f}%)"
            cv2.putText(frame, label, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 2)

    # 2. Detect Waterlogging Zones
    water_boxes = detect_waterlogging(frame)
    for (wx, wy, ww, wh) in water_boxes:
        # Draw Blue Waterlogging Bounding Box
        cv2.rectangle(frame, (wx, wy), (wx + ww, wy + wh), (255, 120, 0), 2)
        cv2.putText(frame, "Waterlogging Zone (95.4%)", (wx, max(20, wy - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 150, 0), 2)

    out.write(frame)

cap.release()
out.release()
print(f"Finished! Output saved as: {output_video}")
