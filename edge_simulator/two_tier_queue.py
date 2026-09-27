"""
Two-Tier Edge Storage Queue Module
SIH Problem Statement 26124: Mobile Urban Intelligence Platform

Prevents SD Card / eMMC Flash Memory wear on Edge Hardware (Raspberry Pi / Jetson).
Tier 1: In-Memory RAM Ring Buffer absorbs continuous high-rate detection payloads.
Tier 2: Deferred SQLite Disk Storage only commits when cellular network drops exceed 60 seconds.
Only the single highest-confidence keyframe crop per track_id is persisted to disk.
"""

import time
import sqlite3
import collections

class TwoTierEdgeQueue:
    def __init__(self, db_path="edge_telemetry.db", ram_capacity=200, blackout_threshold_sec=60):
        self.ram_capacity = ram_capacity
        self.blackout_threshold = blackout_threshold_sec
        self.ram_buffer = collections.deque(maxlen=ram_capacity)
        self.db_path = db_path
        self.network_online = True
        self.last_network_loss_time = None
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._init_db()

    def _init_db(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS offline_event_queue (
                track_id TEXT PRIMARY KEY,
                geohash_id TEXT,
                lat REAL,
                lon REAL,
                defect_type TEXT,
                confidence REAL,
                area_m2 REAL,
                volume_m3 REAL,
                asphalt_kg REAL,
                timestamp REAL,
                synced INTEGER DEFAULT 0
            )
        ''')
        self.conn.commit()

    def push_detection(self, payload):
        """
        Pushes payload to Tier 1 RAM Ring Buffer.
        If network is offline for > 60s, flushes deduplicated highest-confidence items to Tier 2 Disk.
        """
        track_id = payload.get("track_id")
        confidence = payload.get("confidence", 0.0)

        # Update or append in RAM buffer (keep highest confidence per track_id)
        existing_idx = -1
        for i, item in enumerate(self.ram_buffer):
            if item.get("track_id") == track_id:
                existing_idx = i
                break

        if existing_idx >= 0:
            if confidence > self.ram_buffer[existing_idx].get("confidence", 0.0):
                self.ram_buffer[existing_idx] = payload
        else:
            self.ram_buffer.append(payload)

        # Handle Tier 2 Disk Eviction logic
        if not self.network_online:
            if self.last_network_loss_time is None:
                self.last_network_loss_time = time.time()

            offline_duration = time.time() - self.last_network_loss_time
            if offline_duration >= self.blackout_threshold:
                self._evict_ram_to_disk()
        else:
            self.last_network_loss_time = None

    def _evict_ram_to_disk(self):
        """Flushes highest-confidence payloads from RAM Ring Buffer to SQLite disk storage."""
        if not self.ram_buffer:
            return

        cursor = self.conn.cursor()
        eviction_count = 0

        while self.ram_buffer:
            item = self.ram_buffer.popleft()
            cursor.execute('''
                INSERT OR REPLACE INTO offline_event_queue
                (track_id, geohash_id, lat, lon, defect_type, confidence, area_m2, volume_m3, asphalt_kg, timestamp, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            ''', (
                item["track_id"],
                item["geohash_id"],
                item["lat"],
                item["lon"],
                item["defect_type"],
                item["confidence"],
                item["area_m2"],
                item["volume_m3"],
                item["asphalt_kg"],
                item["timestamp"]
            ))
            eviction_count += 1

        self.conn.commit()
        print(f"[Tier-2 Eviction] Flash Protection: Evicted {eviction_count} deduplicated events to SQLite disk.")

    def set_network_state(self, is_online):
        self.network_online = is_online
        if is_online and self.get_offline_disk_count() > 0:
            self.flush_disk_queue_to_network()

    def get_offline_disk_count(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM offline_event_queue WHERE synced = 0")
        return cursor.fetchone()[0]

    def flush_disk_queue_to_network(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM offline_event_queue WHERE synced = 0")
        records = cursor.fetchall()
        print(f"[Network Restored] Flushing {len(records)} buffered offline events to central ingestion.")
        cursor.execute("UPDATE offline_event_queue SET synced = 1 WHERE synced = 0")
        self.conn.commit()

if __name__ == "__main__":
    queue = TwoTierEdgeQueue(blackout_threshold_sec=2) # 2s for testing
    queue.set_network_state(False) # Simulate network drop

    for i in range(10):
        queue.push_detection({
            "track_id": f"TRK_PTH_{i%3}", # 3 unique defects with multiple passes
            "geohash_id": "tdr1v4x9p",
            "lat": 12.9352, "lon": 77.6245,
            "defect_type": "Pothole",
            "confidence": 0.80 + (i * 0.01),
            "area_m2": 0.35, "volume_m3": 0.0245, "asphalt_kg": 56.35,
            "timestamp": time.time()
        })
        time.sleep(0.5)

    print("Offline Disk Records:", queue.get_offline_disk_count())
    queue.set_network_state(True) # Restore connection
