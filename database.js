/* ==========================================================================
   City Pulse OS - Multi-City Relational Database Engine
   Official GTFS Relational Schema & ANPR Hit & Run Intelligence Engine
   ========================================================================== */

class CityPulseDatabaseEngine {
    constructor() {
        this.activeCity = 'JAIPUR'; // Default: JAIPUR, Switchable to DELHI
        this.initDatabase();
    }

    initDatabase() {
        // ------------------------------------------------------------------
        // 1. TRANSIT AGENCIES (GTFS: transit_agency)
        // ------------------------------------------------------------------
        this.agencies = [
            { agency_id: 'JCTSL', agency_name: 'Jaipur City Transport Services Limited', agency_url: 'https://jctsl.org', fleet_type: 'CNG & Electric Low-Floor', city: 'JAIPUR' },
            { agency_id: 'DTC', agency_name: 'Delhi Transport Corporation (GNCTD)', agency_url: 'https://dtc.delhi.gov.in', fleet_type: 'Electric & Low-Floor CNG', city: 'DELHI' },
            { agency_id: 'DIMTS', agency_name: 'Delhi Integrated Multi-Modal Transit System', agency_url: 'https://www.dimts.in', fleet_type: 'Cluster Bus Service', city: 'DELHI' }
        ];

        // ------------------------------------------------------------------
        // 2. BUS DEPOTS & ISBT TERMINALS (GTFS: bus_depots)
        // ------------------------------------------------------------------
        this.depots = [
            { depot_id: 'STP_KG_ISBT', depot_name: 'Kashmere Gate ISBT Terminal', zone: 'North Delhi', lat: 28.6665, lon: 77.2299, charging_available: true },
            { depot_id: 'STP_AV_ISBT', depot_name: 'Anand Vihar ISBT Terminal', zone: 'East Delhi', lat: 28.6493, lon: 77.3156, charging_available: true },
            { depot_id: 'STP_SKK_ISBT', depot_name: 'Sarai Kale Khan ISBT Terminal', zone: 'South-East Delhi', lat: 28.5880, lon: 77.2520, charging_available: true },
            { depot_id: 'STP_NP_TERM', depot_name: 'Nehru Place Bus Terminal', zone: 'South Delhi', lat: 28.5492, lon: 77.2526, charging_available: true },
            { depot_id: 'STP_MEH_TERM', depot_name: 'Mehrauli Bus Terminal', zone: 'South-West Delhi', lat: 28.5204, lon: 77.1812, charging_available: false }
        ];

        // ------------------------------------------------------------------
        // 3. DELHI GTFS BUS STOPS DATABASE
        // ------------------------------------------------------------------
        this.delhiStops = [
            { stop_id: 'STP_KG_ISBT', stop_name: 'Kashmere Gate ISBT', latitude: 28.6665, longitude: 77.2299, is_terminal: true },
            { stop_id: 'STP_AV_ISBT', stop_name: 'Anand Vihar ISBT', latitude: 28.6493, longitude: 77.3156, is_terminal: true },
            { stop_id: 'STP_AIIMS', stop_name: 'AIIMS Hospital / Safdarjung', latitude: 28.5684, longitude: 77.2081, is_terminal: false },
            { stop_id: 'STP_DHK', stop_name: 'Dhaula Kuan Metro Station', latitude: 28.5922, longitude: 77.1617, is_terminal: false },
            { stop_id: 'STP_NP_TERM', stop_name: 'Nehru Place Terminal', latitude: 28.5492, longitude: 77.2526, is_terminal: true }
        ];

        // ------------------------------------------------------------------
        // 4. DELHI BUS ROUTES (GTFS Format)
        // ------------------------------------------------------------------
        this.delhiRoutes = {
            'TMS': {
                route_id: 'R_TMS_CIR', route_short_name: 'TMS',
                name: 'Mudrika (TMS): Inner Ring Road Circular',
                color: '#2DD4BF', agency: 'DTC', schedule: 45, trips: 280, distance_km: 51.0, freq_min: 10,
                origin: 'Anand Vihar ISBT', destination: 'Anand Vihar ISBT (Circular)',
                route_category: 'Mudrika (Ring Road)', potholes: 6, waterlogging: 4,
                path: [
                    [28.6493, 77.3156], [28.5900, 77.2500], [28.5684, 77.2081],
                    [28.5922, 77.1617], [28.6500, 77.1200], [28.6665, 77.2299], [28.6493, 77.3156]
                ],
                buses: [{ id: 'DTC_BUS_TMS_1', name: 'DTC Electric (#DL-1PD-4012)', lat: 28.5684, lon: 77.2081, speed: 42 }]
            },
            'OMS': {
                route_id: 'R_OMS_CIR', route_short_name: 'OMS (-/+)',
                name: 'OMS (- / +): Outer Ring Road Circular',
                color: '#10B981', agency: 'DIMTS', schedule: 50, trips: 310, distance_km: 58.5, freq_min: 12,
                origin: 'Uttam Nagar Terminal', destination: 'Uttam Nagar Terminal (Circular)',
                route_category: 'Outer Ring Road', potholes: 8, waterlogging: 5,
                path: [
                    [28.6180, 77.0600], [28.6980, 77.1400], [28.7300, 77.1600],
                    [28.7000, 77.2600], [28.5492, 77.2526], [28.5400, 77.1800], [28.6180, 77.0600]
                ],
                buses: [{ id: 'DIMTS_BUS_OMS_1', name: 'DIMTS Cluster (#DL-1PC-8842)', lat: 28.6980, lon: 77.1400, speed: 38 }]
            },
            'R543': {
                route_id: 'R_543_UP', route_short_name: '543',
                name: 'Route 543: Anand Vihar ISBT to Kapashera Border',
                color: '#FB923C', agency: 'DTC', schedule: 32, trips: 190, distance_km: 38.5, freq_min: 11,
                origin: 'Anand Vihar ISBT', destination: 'Kapashera Border',
                route_category: 'Trans-Yamuna / South Arterial', potholes: 5, waterlogging: 3,
                path: [
                    [28.6493, 77.3156], [28.6180, 77.2800], [28.5880, 77.2520],
                    [28.5684, 77.2081], [28.5922, 77.1617], [28.5300, 77.0800]
                ],
                buses: [{ id: 'DTC_BUS_543_1', name: 'DTC CNG (#DL-1PC-5430)', lat: 28.5922, lon: 77.1617, speed: 35 }]
            },
            'R764': {
                route_id: 'R_764_UP', route_short_name: '764',
                name: 'Route 764: Najafgarh Terminal to Nehru Place',
                color: '#60A5FA', agency: 'DIMTS', schedule: 28, trips: 175, distance_km: 36.2, freq_min: 14,
                origin: 'Najafgarh Terminal', destination: 'Nehru Place Terminal',
                route_category: 'West – South-East', potholes: 4, waterlogging: 3,
                path: [
                    [28.6100, 76.9800], [28.5800, 77.0600], [28.5600, 77.1200],
                    [28.5492, 77.2526]
                ],
                buses: [{ id: 'DIMTS_BUS_764_1', name: 'DIMTS Cluster (#DL-1PC-7641)', lat: 28.5600, lon: 77.1200, speed: 40 }]
            },
            'R502': {
                route_id: 'R_502_UP', route_short_name: '502',
                name: 'Route 502: Old Delhi Rly Station to Mehrauli',
                color: '#A78BFA', agency: 'DTC', schedule: 26, trips: 210, distance_km: 22.8, freq_min: 9,
                origin: 'Old Delhi Railway Station', destination: 'Mehrauli Terminal',
                route_category: 'North – South Central Radial', potholes: 4, waterlogging: 2,
                path: [
                    [28.6560, 77.2300], [28.6300, 77.2200], [28.5684, 77.2081],
                    [28.5204, 77.1812]
                ],
                buses: [{ id: 'DTC_BUS_502_1', name: 'DTC Electric (#DL-1PD-5022)', lat: 28.6300, lon: 77.2200, speed: 32 }]
            },
            'R615': {
                route_id: 'R_615_UP', route_short_name: '615',
                name: 'Route 615: Minto Road / CP to Poorvanchal Hostel (JNU)',
                color: '#F472B6', agency: 'DTC', schedule: 16, trips: 140, distance_km: 19.5, freq_min: 17,
                origin: 'Minto Road / Connaught Place', destination: 'Poorvanchal Hostel (JNU)',
                route_category: 'Central – South West', potholes: 3, waterlogging: 1,
                path: [
                    [28.6300, 77.2200], [28.6120, 77.2100], [28.5684, 77.2081],
                    [28.5500, 77.1800], [28.5400, 77.1650]
                ],
                buses: [{ id: 'DTC_BUS_615_1', name: 'DTC CNG (#DL-1PD-6150)', lat: 28.6120, lon: 77.2100, speed: 36 }]
            },
            'R427': {
                route_id: 'R_427_UP', route_short_name: '427',
                name: 'Route 427: Nizamuddin Rly Station to Mehrauli',
                color: '#38BDF8', agency: 'DIMTS', schedule: 18, trips: 155, distance_km: 21.0, freq_min: 13,
                origin: 'Nizamuddin Railway Station', destination: 'Mehrauli Terminal',
                route_category: 'Old City – South East', potholes: 3, waterlogging: 2,
                path: [
                    [28.5880, 77.2520], [28.5684, 77.2081], [28.5492, 77.2526],
                    [28.5204, 77.1812]
                ],
                buses: [{ id: 'DIMTS_BUS_427_1', name: 'DIMTS Cluster (#DL-1PC-4270)', lat: 28.5684, lon: 77.2081, speed: 34 }]
            },
            'R85': {
                route_id: 'R_85_UP', route_short_name: '85',
                name: 'Route 85: Punjabi Bagh Terminal to Anand Vihar ISBT',
                color: '#34D399', agency: 'DTC', schedule: 24, trips: 195, distance_km: 25.8, freq_min: 12,
                origin: 'Punjabi Bagh Terminal', destination: 'Anand Vihar ISBT',
                route_category: 'West – Central Arterial', potholes: 4, waterlogging: 2,
                path: [
                    [28.6700, 77.1200], [28.6500, 77.1600], [28.6320, 77.2150],
                    [28.6493, 77.3156]
                ],
                buses: [{ id: 'DTC_BUS_85_1', name: 'DTC Electric (#DL-1PD-0085)', lat: 28.6500, lon: 77.1600, speed: 38 }]
            },
            'R901': {
                route_id: 'R_901_UP', route_short_name: '901',
                name: 'Route 901: Mangolpuri Q-Block to Shivaji Stadium',
                color: '#FBBF24', agency: 'DTC', schedule: 22, trips: 180, distance_km: 23.4, freq_min: 11,
                origin: 'Mangolpuri Q-Block', destination: 'Shivaji Stadium Terminal',
                route_category: 'North West – Central', potholes: 5, waterlogging: 3,
                path: [
                    [28.6980, 77.0800], [28.6700, 77.1200], [28.6500, 77.1600],
                    [28.6320, 77.2150]
                ],
                buses: [{ id: 'DTC_BUS_901_1', name: 'DTC CNG (#DL-1PC-9010)', lat: 28.6700, lon: 77.1200, speed: 37 }]
            },
            'EXP4': {
                route_id: 'R_EXP4_UP', route_short_name: 'EXP4',
                name: 'Airport Express (Exp 4): Kashmere Gate to IGI T3',
                color: '#A78BFA', agency: 'DTC', schedule: 18, trips: 96, distance_km: 26.5, freq_min: 25,
                origin: 'Kashmere Gate ISBT', destination: 'IGI Airport Terminal 3',
                route_category: 'Airport Express Corridor', potholes: 2, waterlogging: 1,
                path: [
                    [28.6665, 77.2299], [28.6300, 77.2200], [28.5922, 77.1617],
                    [28.5560, 77.0900]
                ],
                buses: [{ id: 'DTC_BUS_EXP4_1', name: 'DTC AC Express (#DL-1PD-9004)', lat: 28.5922, lon: 77.1617, speed: 50 }]
            }
        };

        // ------------------------------------------------------------------
        // 5. ANPR HIT & RUN TRACKER RECORDS DATABASE
        // ------------------------------------------------------------------
        const storedANPR = localStorage.getItem('CITY_PULSE_ANPR_EVENTS_V1');
        if (storedANPR) {
            this.anprEvents = JSON.parse(storedANPR);
        } else {
            this.seedANPREvents();
        }

        // ------------------------------------------------------------------
        // 6. MULTI-HAZARD WORK ORDERS DATABASE
        // ------------------------------------------------------------------
        const storedOrders = localStorage.getItem('CITY_PULSE_WORK_ORDERS_V2');
        if (storedOrders) {
            this.workOrders = JSON.parse(storedOrders);
        } else {
            this.seedWorkOrders();
        }
    }

    seedANPREvents() {
        this.anprEvents = [
            // JAIPUR ANPR HIT & RUN INCIDENTS (Ground Truth Dataset Records)
            {
                event_id: 'ANPR-JPR-901', city: 'JAIPUR', plate_number: 'RJ-14-CB-9821',
                vehicle_model: 'White Maruti Suzuki Swift Dzire', vehicle_color: 'White',
                incident_type: 'Pedestrian Crossing Collision (Hit & Run)',
                location: 'MI Road Ajmeri Gate Bus Stop Corridor',
                lat: 26.9157, lon: 75.8170, speed_kmh: 68.4,
                camera_source: 'JCTSL Route 1 Bus #RJ-14-104 (Camera 2)',
                police_status: 'DISPATCHED_TO_TRAFFIC_POLICE', confidence: 0.992,
                dataset_origin: 'archive.zip (State-wise_OLX/RJ)',
                timestamp: '2026-09-04T08:14:22Z'
            },
            {
                event_id: 'ANPR-JPR-902', city: 'JAIPUR', plate_number: 'RJ-45-CG-1029',
                vehicle_model: 'Black Mahindra Thar SUV', vehicle_color: 'Black',
                incident_type: 'Bus Lane Cut & Rear Mirror Side Impact',
                location: 'Chomu Pulia Flyover Approach',
                lat: 26.9580, lon: 75.7760, speed_kmh: 74.2,
                camera_source: 'JCTSL Route 7 Bus #RJ-14-208 (Camera 1)',
                police_status: 'FLAGGED_RTO_SEARCH', confidence: 0.978,
                dataset_origin: 'archive.zip (State-wise_OLX/RJ)',
                timestamp: '2026-09-04T07:45:10Z'
            },

            // DELHI ANPR HIT & RUN INCIDENTS (Ground Truth Dataset Records)
            {
                event_id: 'ANPR-DEL-903', city: 'DELHI', plate_number: 'DL-01-P-9687',
                vehicle_model: 'Silver Hyundai Creta', vehicle_color: 'Silver',
                incident_type: 'Hit & Run Collision at Pedestrian Shelter',
                location: 'Dhaula Kuan Ring Road Bus Interchange',
                lat: 28.5922, lon: 77.1617, speed_kmh: 82.5,
                camera_source: 'DTC Electric Bus #DL-1PD-4012 (Front Cam)',
                police_status: 'DISPATCHED_TO_TRAFFIC_POLICE', confidence: 0.995,
                dataset_origin: 'archive.zip (State-wise_OLX/DL)',
                timestamp: '2026-09-04T08:28:40Z'
            },
            {
                event_id: 'ANPR-DEL-904', city: 'DELHI', plate_number: 'AP-10-AS-3445',
                vehicle_model: 'Commercial Tata Ace Pickup Van', vehicle_color: 'White',
                incident_type: 'Pedestrian Refuge Island Impact & Speed fleeing',
                location: 'Kashmere Gate ISBT Bus Exit Corridor',
                lat: 28.6665, lon: 77.2299, speed_kmh: 65.0,
                camera_source: 'DTC Express Bus #DL-1PD-9004 (Camera 3)',
                police_status: 'DISPATCHED_TO_TRAFFIC_POLICE', confidence: 0.986,
                dataset_origin: 'archive.zip (State-wise_OLX/AP)',
                timestamp: '2026-09-04T06:50:15Z'
            }
        ];
        this.saveANPREvents();
    }

    saveANPREvents() {
        localStorage.setItem('CITY_PULSE_ANPR_EVENTS_V1', JSON.stringify(this.anprEvents));
    }

    getANPREvents(cityFilter = null) {
        if (!cityFilter) return this.anprEvents;
        return this.anprEvents.filter(a => a.city === cityFilter);
    }

    logANPRHitAndRun(eventData) {
        const city = eventData.city || 'JAIPUR';
        const isJaipur = city === 'JAIPUR';
        
        const samplePlates = isJaipur 
            ? ['RJ-14-CB-9821', 'RJ-45-CG-1029', 'RJ-14-GH-4412']
            : ['DL-01-P-9687', 'AP-10-AS-3445', 'DL-10-AS-3445', 'MH-02-CD-4512', 'UP-14-EF-8821'];

        const plate = eventData.plate_number || samplePlates[Math.floor(Math.random() * samplePlates.length)];
        const eventId = isJaipur ? `ANPR-JPR-${Math.floor(900 + Math.random() * 90)}` : `ANPR-DEL-${Math.floor(900 + Math.random() * 90)}`;

        const newRecord = {
            event_id: eventId,
            city: city,
            plate_number: plate,
            vehicle_model: eventData.vehicle_model || 'Black Sedan / Commercial Van',
            vehicle_color: eventData.vehicle_color || 'Dark Grey',
            incident_type: eventData.incident_type || 'Pedestrian Proximity Collision & High-Speed Fleeing',
            location: eventData.location || (isJaipur ? 'MI Road Central Corridor' : 'Ring Road AIIMS Flyover'),
            lat: eventData.lat || (isJaipur ? 26.9157 : 28.5684),
            lon: eventData.lon || (isJaipur ? 75.8170 : 77.2081),
            speed_kmh: eventData.speed_kmh || (60 + Math.floor(Math.random() * 30)),
            camera_source: eventData.camera_source || (isJaipur ? 'JCTSL Bus #RJ-14-104 AI Cam' : 'DTC Bus #DL-1PD-4012 AI Cam'),
            police_status: 'DISPATCHED_TO_TRAFFIC_POLICE',
            confidence: 0.988,
            dataset_origin: 'archive.zip Ground Truth',
            timestamp: new Date().toISOString()
        };

        this.anprEvents.unshift(newRecord);
        this.saveANPREvents();
        return newRecord;
    }

    seedWorkOrders() {
        this.workOrders = [
            // JAIPUR SEED INCIDENTS
            {
                ticket_id: 'WO-JPR-101', city: 'JAIPUR', route_num: 'R1', category: 'POTHOLE',
                defect_type: 'Deep Volumetric Asphalt Pothole', road_name: 'Chomu Pulia Flyover (VKI)',
                location: '26.9580 N, 75.7760 E', lat: 26.9580, lon: 75.7760,
                volume_m3: 0.0302, asphalt_kg: 69.55, depth_cm: 7.2,
                status: 'OPEN_DISPATCHED', contractor: 'Jaipur Infra Projects Corp',
                consensus_score: 0.984, logged_at: '2026-08-30T10:15:00Z'
            },
            {
                ticket_id: 'WO-JPR-102', city: 'JAIPUR', route_num: 'R7', category: 'WATERLOGGING',
                defect_type: 'Roadside Waterlogging Dip Zone', road_name: 'Khirni Phatak Underpass',
                location: '26.8850 N, 75.7480 E', lat: 26.8850, lon: 75.7480,
                volume_m3: 0.1250, asphalt_kg: null, depth_cm: 14.5,
                status: 'OPEN_DISPATCHED', contractor: 'Raj Infrastructure Ltd',
                consensus_score: 0.942, logged_at: '2026-08-30T11:20:00Z'
            },

            // DELHI SEED INCIDENTS
            {
                ticket_id: 'WO-DEL-201', city: 'DELHI', route_num: 'TMS', category: 'POTHOLE',
                defect_type: 'Severe Structural Asphalt Breakdown', road_name: 'Dhaula Kuan Ring Road Flyover',
                location: '28.5922 N, 77.1617 E', lat: 28.5922, lon: 77.1617,
                volume_m3: 0.0450, asphalt_kg: 103.50, depth_cm: 8.5,
                status: 'OPEN_DISPATCHED', contractor: 'Delhi Public Works Department (PWD)',
                consensus_score: 0.978, logged_at: '2026-09-01T08:30:00Z'
            },
            {
                ticket_id: 'WO-DEL-202', city: 'DELHI', route_num: 'OMS', category: 'WATERLOGGING',
                defect_type: 'Chronic Monsoon Waterlogging Dip', road_name: 'Minto Road Underpass / CP Corridor',
                location: '28.6300 N, 77.2200 E', lat: 28.6300, lon: 77.2200,
                volume_m3: 0.2800, asphalt_kg: null, depth_cm: 22.0,
                status: 'OPEN_DISPATCHED', contractor: 'New Delhi Municipal Council (NDMC)',
                consensus_score: 0.992, logged_at: '2026-09-02T14:10:00Z'
            },
            {
                ticket_id: 'WO-DEL-203', city: 'DELHI', route_num: '543', category: 'POTHOLE',
                defect_type: 'Arterial Road Edge Pothole Cluster', road_name: 'Ashram Chowk Flyover Approach',
                location: '28.5684 N, 77.2081 E', lat: 28.5684, lon: 77.2081,
                volume_m3: 0.0380, asphalt_kg: 87.40, depth_cm: 6.8,
                status: 'OPEN_DISPATCHED', contractor: 'L&T Transport Infra Services',
                consensus_score: 0.965, logged_at: '2026-09-03T09:45:00Z'
            },
            {
                ticket_id: 'WO-DEL-204', city: 'DELHI', route_num: '764', category: 'GARBAGE',
                defect_type: 'Uncollected Commercial Solid Waste Dump', road_name: 'Nehru Place Terminal Entry',
                location: '28.5492 N, 77.2526 E', lat: 28.5492, lon: 77.2526,
                volume_m3: 0.4500, asphalt_kg: null, depth_cm: null,
                status: 'OPEN_DISPATCHED', contractor: 'MCD Waste Management Cell',
                consensus_score: 0.950, logged_at: '2026-09-03T16:20:00Z'
            }
        ];
        this.saveWorkOrders();
    }

    saveWorkOrders() {
        localStorage.setItem('CITY_PULSE_WORK_ORDERS_V2', JSON.stringify(this.workOrders));
    }

    getWorkOrders(cityFilter = null) {
        if (!cityFilter) return this.workOrders;
        return this.workOrders.filter(w => w.city === cityFilter);
    }

    getWorkOrderById(id) {
        return this.workOrders.find(w => w.ticket_id === id);
    }

    updateWorkOrderStatus(ticketId, newStatus, extraMetaData = {}) {
        const order = this.getWorkOrderById(ticketId);
        if (order) {
            order.status = newStatus;
            Object.assign(order, extraMetaData);
            this.saveWorkOrders();
            return order;
        }
        return null;
    }
}

// Global Database Instance
window.jctslDB = new CityPulseDatabaseEngine();
