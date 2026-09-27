-- ==============================================================================
-- Official Delhi Public Transit GTFS Relational Database Schema (PostgreSQL / PostGIS / SQLite)
-- Department of Transport (GNCTD) - DTC & DIMTS Cluster Bus Transit Network
-- Mapped to Delhi Open Transit Data (OTD) Standard (https://otd.delhi.gov.in/)
-- ==============================================================================

-- 1. Bus Operators / Transit Agencies (DTC, DIMTS)
CREATE TABLE IF NOT EXISTS transit_agency (
    agency_id VARCHAR(20) PRIMARY KEY,
    agency_name VARCHAR(100) NOT NULL,
    agency_url VARCHAR(255),
    fleet_type VARCHAR(50) -- 'Electric Low Floor', 'CNG Standard', etc.
);

-- 2. Bus Depots & ISBT Terminals
CREATE TABLE IF NOT EXISTS bus_depots (
    depot_id VARCHAR(20) PRIMARY KEY,
    depot_name VARCHAR(100) NOT NULL,
    zone VARCHAR(50), -- 'North', 'South', 'East', 'West', 'Central'
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    charging_station_available BOOLEAN DEFAULT FALSE
);

-- 3. Bus Routes
CREATE TABLE IF NOT EXISTS bus_routes (
    route_id VARCHAR(50) PRIMARY KEY,
    route_short_name VARCHAR(20) NOT NULL, -- e.g., '543', 'OMS (-)', '764', 'TMS'
    route_long_name VARCHAR(255) NOT NULL, -- e.g., 'Anand Vihar ISBT To Uttam Nagar Terminal'
    agency_id VARCHAR(20) REFERENCES transit_agency(agency_id),
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    route_category VARCHAR(50), -- 'Mudrika (Ring Road)', 'Radial', 'Feeder', 'Cross-City'
    distance_km DECIMAL(5, 2)
);

-- 4. Bus Stops with Spatial Coordinates
CREATE TABLE IF NOT EXISTS bus_stops (
    stop_id VARCHAR(50) PRIMARY KEY,
    stop_name VARCHAR(150) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    is_terminal BOOLEAN DEFAULT FALSE
);

-- 5. Route Trips & Scheduling
CREATE TABLE IF NOT EXISTS route_trips (
    trip_id VARCHAR(100) PRIMARY KEY,
    route_id VARCHAR(50) REFERENCES bus_routes(route_id),
    direction_id INT DEFAULT 0, -- 0: Outbound, 1: Inbound
    first_bus_time TIME,
    last_bus_time TIME,
    peak_headway_min INT -- Frequency in minutes during rush hours
);

-- 6. Stop Sequence for Each Route (Route Geometry)
CREATE TABLE IF NOT EXISTS stop_sequences (
    route_id VARCHAR(50) REFERENCES bus_routes(route_id),
    stop_id VARCHAR(50) REFERENCES bus_stops(stop_id),
    stop_sequence_order INT NOT NULL,
    PRIMARY KEY (route_id, stop_sequence_order)
);

-- ==============================================================================
-- OFFICIAL SEED DATA INJECTION
-- ==============================================================================

-- 1. Insert Transit Agencies
INSERT INTO transit_agency (agency_id, agency_name, agency_url, fleet_type) VALUES
('DTC', 'Delhi Transport Corporation', 'https://dtc.delhi.gov.in', 'Electric & Low-Floor CNG'),
('DIMTS', 'Delhi Integrated Multi-Modal Transit System', 'https://www.dimts.in', 'Cluster Bus Service');

-- 2. Insert Bus Depots & Major Terminals
INSERT INTO bus_depots (depot_id, depot_name, zone, latitude, longitude, charging_station_available) VALUES
('STP_KG_ISBT', 'Kashmere Gate ISBT Terminal', 'North Delhi', 28.6665, 77.2299, TRUE),
('STP_AV_ISBT', 'Anand Vihar ISBT Terminal', 'East Delhi', 28.6493, 77.3156, TRUE),
('STP_SKK_ISBT', 'Sarai Kale Khan ISBT Terminal', 'South-East Delhi', 28.5880, 77.2520, TRUE),
('STP_NP_TERM', 'Nehru Place Bus Terminal', 'South Delhi', 28.5492, 77.2526, TRUE),
('STP_MEH_TERM', 'Mehrauli Bus Terminal', 'South-West Delhi', 28.5204, 77.1812, FALSE);

-- 3. Insert Key Route Records
INSERT INTO bus_routes (route_id, route_short_name, route_long_name, agency_id, origin, destination, route_category, distance_km) VALUES
('R_TMS_CIR', 'TMS', 'Mudrika (TMS): Teevra Mudrika Ring Road Circular', 'DTC', 'Anand Vihar ISBT', 'Anand Vihar ISBT (Circular)', 'Mudrika (Ring Road)', 51.0),
('R_OMS_CIR', 'OMS (-/+)', 'OMS (- / +): Outer Ring Road Circular', 'DIMTS', 'Uttam Nagar Terminal', 'Uttam Nagar Terminal (Circular)', 'Outer Ring Road', 58.5),
('R_543_UP', '543', 'Route 543: Anand Vihar ISBT to Kapashera Border', 'DTC', 'Anand Vihar ISBT', 'Kapashera Border', 'Trans-Yamuna / South Arterial', 38.5),
('R_764_UP', '764', 'Route 764: Najafgarh Terminal to Nehru Place', 'DIMTS', 'Najafgarh Terminal', 'Nehru Place Terminal', 'West – South-East', 36.2),
('R_502_UP', '502', 'Route 502: Old Delhi Rly Station to Mehrauli', 'DTC', 'Old Delhi Railway Station', 'Mehrauli Terminal', 'North – South Central Radial', 22.8),
('R_615_UP', '615', 'Route 615: Minto Road / CP to Poorvanchal Hostel (JNU)', 'DTC', 'Minto Road / Connaught Place', 'Poorvanchal Hostel (JNU)', 'Central – South West', 19.5),
('R_427_UP', '427', 'Route 427: Nizamuddin Rly Station to Mehrauli', 'DIMTS', 'Nizamuddin Railway Station', 'Mehrauli Terminal', 'Old City – South East', 21.0),
('R_85_UP', '85', 'Route 85: Punjabi Bagh Terminal to Anand Vihar ISBT', 'DTC', 'Punjabi Bagh Terminal', 'Anand Vihar ISBT', 'West – Central Arterial', 25.8),
('R_901_UP', '901', 'Route 901: Mangolpuri Q-Block to Shivaji Stadium', 'DTC', 'Mangolpuri Q-Block', 'Shivaji Stadium Terminal', 'North West – Central', 23.4),
('R_EXP4_UP', 'EXP4', 'Airport Express (Exp 4): Kashmere Gate to IGI T3', 'DTC', 'Kashmere Gate ISBT', 'IGI Airport Terminal 3', 'Airport Express Corridor', 26.5);

-- 4. Insert Major Bus Stop Coordinates
INSERT INTO bus_stops (stop_id, stop_name, latitude, longitude, is_terminal) VALUES
('STP_KG_ISBT', 'Kashmere Gate ISBT', 28.6665, 77.2299, TRUE),
('STP_AV_ISBT', 'Anand Vihar ISBT', 28.6493, 77.3156, TRUE),
('STP_AIIMS', 'AIIMS Hospital / Safdarjung', 28.5684, 77.2081, FALSE),
('STP_DHK', 'Dhaula Kuan Metro Station', 28.5922, 77.1617, FALSE),
('STP_NP_TERM', 'Nehru Place Terminal', 28.5492, 77.2526, TRUE),
('STP_MEH_TERM', 'Mehrauli Terminal', 28.5204, 77.1812, TRUE);

-- 5. Insert Route Trips
INSERT INTO route_trips (trip_id, route_id, direction_id, first_bus_time, last_bus_time, peak_headway_min) VALUES
('TRIP_TMS_01', 'R_TMS_CIR', 0, '05:00:00', '23:00:00', 10),
('TRIP_OMS_01', 'R_OMS_CIR', 0, '05:15:00', '22:45:00', 12),
('TRIP_543_01', 'R_543_UP', 0, '05:30:00', '22:30:00', 11),
('TRIP_764_01', 'R_764_UP', 0, '06:00:00', '22:00:00', 14),
('TRIP_502_01', 'R_502_UP', 0, '05:45:00', '23:15:00', 9);

-- 6. Insert Stop Sequences
INSERT INTO stop_sequences (route_id, stop_id, stop_sequence_order) VALUES
('R_TMS_CIR', 'STP_AV_ISBT', 1),
('R_TMS_CIR', 'STP_AIIMS', 2),
('R_TMS_CIR', 'STP_DHK', 3),
('R_TMS_CIR', 'STP_KG_ISBT', 4),
('R_TMS_CIR', 'STP_AV_ISBT', 5),
('R_543_UP', 'STP_AV_ISBT', 1),
('R_543_UP', 'STP_AIIMS', 2),
('R_543_UP', 'STP_DHK', 3),
('R_764_UP', 'STP_DHK', 1),
('R_764_UP', 'STP_NP_TERM', 2),
('R_502_UP', 'STP_KG_ISBT', 1),
('R_502_UP', 'STP_AIIMS', 2),
('R_502_UP', 'STP_MEH_TERM', 3);
