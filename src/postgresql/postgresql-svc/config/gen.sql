-- ======================
-- GENERAL CONFIG
-- ======================


-- ======================
-- CREATE INIT
-- ======================

DROP TABLE IF EXISTS stage1_init;

CREATE TABLE stage1_init (
       stage1_id VARCHAR(80), 
       stage1_cluster VARCHAR(80), 
       stage1_zone VARCHAR(80), 
       stage1_timestamp TIMESTAMP With TIME ZONE
);

--
-- INSERT INIT test records
--

INSERT INTO stage1_init (stage1_id, stage1_cluster, stage1_zone, stage1_timestamp) 
       VALUES ('stage1-gen-clgen-zgen', 'clustergen', 'zonegen', clock_timestamp());


-- ======================
-- CREATE SIGNAL
-- ======================

DROP TABLE IF EXISTS stage1_signal;

/*
CREATE TABLE stage1_signal (
       stage1_id VARCHAR(80), 
       stage1_cluster VARCHAR(80), 
       stage1_zone VARCHAR(80),
       stage1_timestamp TIMESTAMP With TIME ZONE,
       locpick_id VARCHAR(80),
       beacon_id VARCHAR(80),
       beacon_zone VARCHAR(80),
       loc_name VARCHAR(80),
       loc_lonlat VARCHAR(80),
       loc_zone VARCHAR(80)
);
*/

CREATE TABLE stage1_signal (
       stage1_id VARCHAR(80), 
       stage1_cluster VARCHAR(80), 
       stage1_zone VARCHAR(80),
       stage1_timestamp TIMESTAMP,
       locpick_id VARCHAR(80),
       beacon_id VARCHAR(80),
       beacon_zone VARCHAR(80),
       beacon_ts TIMESTAMP,
       loc_name VARCHAR(80),
       loc_lonlat VARCHAR(80),
       loc_zone VARCHAR(80),
       rest_call VARCHAR(200)
);

CREATE INDEX stage1_signal_col_stage1_id_idx ON stage1_signal(stage1_id);
CREATE INDEX stage1_signal_col_stage1_timestamp_idx ON stage1_signal(stage1_timestamp);


INSERT INTO stage1_signal (
       stage1_id, 
       stage1_cluster, 
       stage1_zone, 
       stage1_timestamp,
       locpick_id,
       beacon_id,
       beacon_zone,
       loc_name,
       loc_lonlat,
       loc_zone
)  VALUES (
   'stage1-gen-clgen-zgen', 
   'clustergen',
   'zonegen',
   clock_timestamp(),
   'locpickidgen',
   'beaconidgen',
   'beaconzonegen',
   'locnamegen',
   'loclonlatgen',
   'loczonegen'
);








