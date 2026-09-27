"""
City Pulse OS - Folium GIS Map Generator
Processes detected incidents (Potholes, Waterlogging, Garbage) from telemetry CSV
and renders interactive Folium map with Dark GIS View and Street View tiles.
"""

import os
import pandas as pd
import folium

def generate_city_map(csv_path="detected_incidents_geo.csv", output_html="folium_city_map.html"):
    # Create sample CSV if not present
    if not os.path.exists(csv_path):
        sample_data = pd.DataFrame([
            {"incident_id": "WO-JPR-101", "type": "Pothole", "latitude": 26.9580, "longitude": 75.7760, "severity": "HIGH"},
            {"incident_id": "WO-JPR-102", "type": "Waterlogging", "latitude": 26.8850, "longitude": 75.7480, "severity": "HIGH"},
            {"incident_id": "WO-JPR-103", "type": "Pothole", "latitude": 26.9157, "longitude": 75.8170, "severity": "MEDIUM"},
            {"incident_id": "WO-JPR-104", "type": "Garbage Dump", "latitude": 26.9239, "longitude": 75.8267, "severity": "MEDIUM"},
            {"incident_id": "WO-JPR-105", "type": "Pothole", "latitude": 26.8143, "longitude": 75.7950, "severity": "HIGH"}
        ])
        sample_data.to_csv(csv_path, index=False)
        print(f"[Info] Created seed incidents CSV at: {csv_path}")

    # Load detected data
    df = pd.read_csv(csv_path)

    # 1. Drop rows with null or non-numeric coordinates
    df = df.dropna(subset=["latitude", "longitude"])
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df = df.dropna(subset=["latitude", "longitude"])

    # 2. Filter out coordinates out of range or stuck at 0, 0
    df = df[(df["latitude"].between(-90, 90)) & (df["longitude"].between(-180, 180))]
    df = df[(df["latitude"] != 0.0) & (df["longitude"] != 0.0)]

    if not df.empty:
        center_lat = float(df["latitude"].median())
        center_lon = float(df["longitude"].median())
    else:
        # Default fallback if telemetry is missing (Jaipur City Center)
        center_lat, center_lon = 26.9124, 75.7873

    # Initialize Folium Map with Dark GIS View as tile option + OpenStreetMap
    city_map = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=13,
        tiles="CartoDB dark_matter", # Fixed Dark GIS View map tile
        name="Dark GIS View"
    )

    # Add Street View (OpenStreetMap) tile layer option
    folium.TileLayer("OpenStreetMap", name="Street View").add_to(city_map)
    
    # Add Esri Satellite View tile layer option
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr="Esri World Imagery",
        name="Satellite View"
    ).add_to(city_map)

    # Plot incident markers
    for idx, row in df.iterrows():
        color = "red" if row["type"] == "Pothole" else ("blue" if row["type"] == "Waterlogging" else "orange")
        folium.CircleMarker(
            location=[row["latitude"], row["longitude"]],
            radius=7,
            popup=f"<b>{row['incident_id']}</b><br>Type: {row['type']}<br>Severity: {row['severity']}",
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.8
        ).add_to(city_map)

    # Add Layer Control Switcher
    folium.LayerControl(position="topright").add_to(city_map)

    city_map.save(output_html)
    print(f"[Success] Generated Folium map with fixed Dark GIS View at: {output_html}")
    return output_html

if __name__ == "__main__":
    generate_city_map()
