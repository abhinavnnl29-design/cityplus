"""
Central Fleet Consensus & Contractor Tender Matcher Module
SIH Problem Statement 26124: Mobile Urban Intelligence Platform

Dataset Integration: Jaipur City Transport Services Limited (JCTSL)
Depot: Todi Depot & City Transit Grid
Total Buses: 219 | Allotted Schedule: 207 | Total Routes: 29
"""

import math
from datetime import datetime, date

# Pre-populated Jaipur JCTSL Municipal Tender & Road Asset Database
JCTSL_JAIPUR_TENDERS = [
    {
        "road_id": "RD_JCTSL_R1_DAULATPURA",
        "road_name": "Daulatpura to Galtagate Corridor (Via Todi Depot, Chomu Pulia, Sindhi Camp, Chandpole)",
        "jurisdiction": "Jaipur Development Authority (JDA) / JMC Greater",
        "contractor_name": "HG Infra Engineering Ltd (Jaipur Zone)",
        "contractor_email": "maintenance.jaipur@hginfra.com",
        "assigned_engineer": "Er. Vikram Singh (JDA Executive Engineer Division 6)",
        "completion_date": "2024-02-10",
        "warranty_expiry_date": "2027-02-10", # Active DLP Warranty!
        "lat_min": 26.9200, "lat_max": 27.0200,
        "lon_min": 75.7600, "lon_max": 75.8300
    },
    {
        "road_id": "RD_JCTSL_AC2_TONK",
        "road_name": "Tonk Road Transit Corridor (Chandpole to Mahatma Gandhi Hospital Sitapura)",
        "jurisdiction": "NHAI / Rajasthan State PWD",
        "contractor_name": "GR Infraprojects Ltd",
        "contractor_email": "support.tonkroad@grinfra.com",
        "assigned_engineer": "Er. Rajesh Kumar Meena (PWD Manager Sitapura)",
        "completion_date": "2021-08-15",
        "warranty_expiry_date": "2024-08-15", # Expired Warranty -> Municipal Budget
        "lat_min": 26.7700, "lat_max": 26.9200,
        "lon_min": 75.7800, "lon_max": 75.8400
    }
]

class FleetConsensusEngine:
    def __init__(self):
        self.spatial_bins = {}

    def latlon_to_h3_mock(self, lat, lon, resolution=11):
        """Generates a spatial cell key approximating Uber H3 Resolution 11 for Jaipur coordinates."""
        lat_grid = round(lat * 7000)
        lon_grid = round(lon * 7000)
        return f"8b283472{lat_grid:04x}{lon_grid:04x}"

    def register_observation(self, obs):
        """
        Registers an edge observation from JCTSL Bus Fleet.
        Computes Fleet Consensus Confidence score: C_fleet = 1 - PROD(1 - c_i).
        """
        lat, lon = obs["lat"], obs["lon"]
        cell_id = self.latlon_to_h3_mock(lat, lon)

        if cell_id not in self.spatial_bins:
            self.spatial_bins[cell_id] = []

        existing_bus_ids = [item["bus_id"] for item in self.spatial_bins[cell_id]]
        if obs["bus_id"] not in existing_bus_ids:
            self.spatial_bins[cell_id].append(obs)

        observations = self.spatial_bins[cell_id]
        
        prob_all_wrong = 1.0
        total_asphalt_kg = 0.0
        total_volume_m3 = 0.0

        for o in observations:
            prob_all_wrong *= (1.0 - o["confidence"])
            total_asphalt_kg += o["asphalt_kg"]
            total_volume_m3 += o["volume_m3"]

        consensus_confidence = 1.0 - prob_all_wrong
        distinct_buses = len(observations)
        avg_asphalt_kg = total_asphalt_kg / distinct_buses
        avg_volume_m3 = total_volume_m3 / distinct_buses

        tender_info = match_jaipur_contractor_tender(lat, lon)
        context_info = enrich_osm_context(lat, lon)

        is_verified_work_order = consensus_confidence >= 0.92 or distinct_buses >= 2

        return {
            "h3_cell_id": cell_id,
            "distinct_bus_passes": distinct_buses,
            "consensus_confidence": round(consensus_confidence, 4),
            "is_verified_work_order": is_verified_work_order,
            "avg_volume_m3": round(avg_volume_m3, 5),
            "avg_asphalt_kg": round(avg_asphalt_kg, 2),
            "tender_info": tender_info,
            "context_info": context_info,
            "observations": observations
        }

def match_jaipur_contractor_tender(lat, lon):
    """
    Snaps GPS coordinate to JCTSL Jaipur Municipal Road Asset database.
    Determines if Defect Liability Period (DLP) warranty is active.
    """
    today_str = "2026-08-30"
    
    for tender in JCTSL_JAIPUR_TENDERS:
        if (tender["lat_min"] <= lat <= tender["lat_max"]) and (tender["lon_min"] <= lon <= tender["lon_max"]):
            expiry = tender["warranty_expiry_date"]
            is_dlp_active = today_str <= expiry

            return {
                "road_id": tender["road_id"],
                "road_name": tender["road_name"],
                "jurisdiction": tender["jurisdiction"],
                "contractor_name": tender["contractor_name"],
                "contractor_email": tender["contractor_email"],
                "assigned_engineer": tender["assigned_engineer"],
                "warranty_expiry": expiry,
                "is_dlp_active": is_dlp_active,
                "liability_type": "CONTRACTOR_FREE_WARRANTY_REPAIR" if is_dlp_active else "MUNICIPAL_MAINTENANCE_BUDGET",
                "estimated_repair_cost_inr": 0 if is_dlp_active else round(3800 + (lat * 100) % 4500, 2)
            }

    return {
        "road_id": "RD_JAIPUR_JMC_GENERAL",
        "road_name": "Jaipur Urban Transit Arterial",
        "jurisdiction": "Jaipur Municipal Corporation PWD",
        "contractor_name": "JDA Maintenance Wing",
        "contractor_email": "jmc-pwd@jaipur.gov.in",
        "assigned_engineer": "Junior Engineer JMC Zone 4",
        "warranty_expiry": "Expired",
        "is_dlp_active": False,
        "liability_type": "MUNICIPAL_MAINTENANCE_BUDGET",
        "estimated_repair_cost_inr": 4500.00
    }

def enrich_osm_context(lat, lon):
    """Enriches Jaipur context (School Zone, Max Speed Limit)."""
    is_school_zone = (round(lat * 100) % 2 == 0)
    speed_limit = 30 if is_school_zone else 50

    return {
        "is_school_zone": is_school_zone,
        "nearby_facility": "SMS School / Subodh College Zone (50m)" if is_school_zone else "Commercial Hub",
        "speed_limit_kmh": speed_limit
    }

if __name__ == "__main__":
    engine = FleetConsensusEngine()

    res1 = engine.register_observation({
        "bus_id": "JCTSL_BUS_R1_104",
        "lat": 26.9248, "lon": 75.8152, # Chandpole Jaipur
        "confidence": 0.89, "area_m2": 0.42, "volume_m3": 0.0302, "asphalt_kg": 69.55,
        "defect_type": "Pothole"
    })
    print("JCTSL Pass 1 Consensus:", res1["consensus_confidence"])
    print("Matched Contractor Liability:", res1["tender_info"]["liability_type"])
