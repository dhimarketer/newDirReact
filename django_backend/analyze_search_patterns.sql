-- Smart Search Pattern Analysis SQL Queries
-- Run these queries directly on your database to analyze existing patterns
-- This will help optimize the smart search feature based on real data

-- =====================================================
-- 1. POLITICAL PARTY ANALYSIS
-- =====================================================

-- Count unique party names and their frequency
SELECT 
    party, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM t1 WHERE party IS NOT NULL AND party != ''), 2) as percentage
FROM t1 
WHERE party IS NOT NULL AND party != '' 
GROUP BY party 
ORDER BY count DESC;

-- Find all unique party names (alphabetical)
SELECT DISTINCT party 
FROM t1 
WHERE party IS NOT NULL AND party != '' 
ORDER BY party;

-- =====================================================
-- 2. ADDRESS PATTERN ANALYSIS
-- =====================================================

-- Extract and count address suffixes (last 3-5 characters)
SELECT 
    RIGHT(address, 3) as suffix_3,
    COUNT(*) as count
FROM t1 
WHERE address IS NOT NULL AND address != '' AND LENGTH(address) >= 3
GROUP BY RIGHT(address, 3)
ORDER BY count DESC
LIMIT 20;

SELECT 
    RIGHT(address, 4) as suffix_4,
    COUNT(*) as count
FROM t1 
WHERE address IS NOT NULL AND address != '' AND LENGTH(address) >= 4
GROUP BY RIGHT(address, 4)
ORDER BY count DESC
LIMIT 20;

SELECT 
    RIGHT(address, 5) as suffix_5,
    COUNT(*) as count
FROM t1 
WHERE address IS NOT NULL AND address != '' AND LENGTH(address) >= 5
GROUP BY RIGHT(address, 5)
ORDER BY count DESC
LIMIT 20;

-- Extract and count address prefixes (first 3-5 characters)
SELECT 
    LEFT(address, 3) as prefix_3,
    COUNT(*) as count
FROM t1 
WHERE address IS NOT NULL AND address != '' AND LENGTH(address) >= 3
GROUP BY LEFT(address, 3)
ORDER BY count DESC
LIMIT 20;

SELECT 
    LEFT(address, 4) as prefix_4,
    COUNT(*) as count
FROM t1 
WHERE address IS NOT NULL AND address != '' AND LENGTH(address) >= 4
GROUP BY LEFT(address, 4)
ORDER BY count DESC
LIMIT 20;

SELECT 
    LEFT(address, 5) as prefix_5,
    COUNT(*) as count
FROM t1 
WHERE address IS NOT NULL AND address != '' AND LENGTH(address) >= 5
GROUP BY LEFT(address, 5)
ORDER BY count DESC
LIMIT 20;

-- Find common address patterns (addresses that appear multiple times)
SELECT 
    address,
    COUNT(*) as count
FROM t1 
WHERE address IS NOT NULL AND address != '' 
GROUP BY address 
HAVING count > 5
ORDER BY count DESC
LIMIT 100;

-- Check for specific Maldivian address patterns
SELECT 
    CASE 
        WHEN LOWER(address) LIKE '%ge%' THEN 'Contains "ge"'
        WHEN LOWER(address) LIKE '%maa%' THEN 'Contains "maa"'
        WHEN LOWER(address) LIKE '%villa%' THEN 'Contains "villa"'
        WHEN LOWER(address) LIKE '%house%' THEN 'Contains "house"'
        WHEN LOWER(address) LIKE '%flat%' THEN 'Contains "flat"'
        WHEN LOWER(address) LIKE '%room%' THEN 'Contains "room"'
        WHEN LOWER(address) LIKE '%floor%' THEN 'Contains "floor"'
        WHEN LOWER(address) LIKE '%block%' THEN 'Contains "block"'
        WHEN LOWER(address) LIKE '%area%' THEN 'Contains "area"'
        WHEN LOWER(address) LIKE '%zone%' THEN 'Contains "zone"'
        WHEN LOWER(address) LIKE '%district%' THEN 'Contains "district"'
        WHEN LOWER(address) LIKE '%ward%' THEN 'Contains "ward"'
        WHEN LOWER(address) LIKE '%sector%' THEN 'Contains "sector"'
        ELSE 'Other'
    END as pattern_type,
    COUNT(*) as count
FROM t1 
WHERE address IS NOT NULL AND address != '' 
GROUP BY pattern_type
ORDER BY count DESC;

-- =====================================================
-- 3. ISLAND AND ATOLL ANALYSIS
-- =====================================================

-- Count unique island names and their frequency
SELECT 
    island, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM t1 WHERE island IS NOT NULL AND island != ''), 2) as percentage
FROM t1 
WHERE island IS NOT NULL AND island != '' 
GROUP BY island 
ORDER BY count DESC
LIMIT 30;

-- Count unique atoll names and their frequency
SELECT 
    atoll, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM t1 WHERE atoll IS NOT NULL AND atoll != ''), 2) as percentage
FROM t1 
WHERE atoll IS NOT NULL AND atoll != '' 
GROUP BY atoll 
ORDER BY count DESC
LIMIT 30;

-- Find all unique island names (alphabetical)
SELECT DISTINCT island 
FROM t1 
WHERE island IS NOT NULL AND island != '' 
ORDER BY island;

-- Find all unique atoll names (alphabetical)
SELECT DISTINCT atoll 
FROM t1 
WHERE atoll IS NOT NULL AND atoll != '' 
ORDER BY atoll;

-- =====================================================
-- 4. NAME PATTERN ANALYSIS
-- =====================================================

-- Analyze name length distribution
SELECT 
    LENGTH(name) as name_length,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM t1 WHERE name IS NOT NULL AND name != ''), 2) as percentage
FROM t1 
WHERE name IS NOT NULL AND name != '' 
GROUP BY LENGTH(name)
ORDER BY name_length;

-- Find common names (names that appear multiple times)
SELECT 
    name,
    COUNT(*) as count
FROM t1 
WHERE name IS NOT NULL AND name != '' 
GROUP BY name 
HAVING count > 3
ORDER BY count DESC
LIMIT 50;

-- Analyze name structure (single vs multiple words)
SELECT 
    CASE 
        WHEN LENGTH(TRIM(name)) - LENGTH(REPLACE(TRIM(name), ' ', '')) = 0 THEN 'Single Word'
        WHEN LENGTH(TRIM(name)) - LENGTH(REPLACE(TRIM(name), ' ', '')) = 1 THEN 'Two Words'
        WHEN LENGTH(TRIM(name)) - LENGTH(REPLACE(TRIM(name), ' ', '')) = 2 THEN 'Three Words'
        ELSE 'Four+ Words'
    END as name_structure,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM t1 WHERE name IS NOT NULL AND name != ''), 2) as percentage
FROM t1 
WHERE name IS NOT NULL AND name != '' 
GROUP BY name_structure
ORDER BY count DESC;

-- =====================================================
-- 5. PROFESSION ANALYSIS
-- =====================================================

-- Count unique profession values and their frequency
SELECT 
    profession, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM t1 WHERE profession IS NOT NULL AND profession != ''), 2) as percentage
FROM t1 
WHERE profession IS NOT NULL AND profession != '' 
GROUP BY profession 
ORDER BY count DESC
LIMIT 30;

-- Find all unique profession values (alphabetical)
SELECT DISTINCT profession 
FROM t1 
WHERE profession IS NOT NULL AND profession != '' 
ORDER BY profession;

-- =====================================================
-- 6. OVERALL STATISTICS
-- =====================================================

-- Total entries and field completion rates
SELECT 
    COUNT(*) as total_entries,
    COUNT(CASE WHEN party IS NOT NULL AND party != '' THEN 1 END) as entries_with_party,
    COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) as entries_with_address,
    COUNT(CASE WHEN island IS NOT NULL AND island != '' THEN 1 END) as entries_with_island,
    COUNT(CASE WHEN atoll IS NOT NULL AND atoll != '' THEN 1 END) as entries_with_atoll,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as entries_with_name,
    COUNT(CASE WHEN profession IS NOT NULL AND profession != '' THEN 1 END) as entries_with_profession
FROM t1;

-- Field completion percentages
SELECT 
    ROUND(COUNT(CASE WHEN party IS NOT NULL AND party != '' THEN 1 END) * 100.0 / COUNT(*), 2) as party_completion_percent,
    ROUND(COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) * 100.0 / COUNT(*), 2) as address_completion_percent,
    ROUND(COUNT(CASE WHEN island IS NOT NULL AND island != '' THEN 1 END) * 100.0 / COUNT(*), 2) as island_completion_percent,
    ROUND(COUNT(CASE WHEN atoll IS NOT NULL AND atoll != '' THEN 1 END) * 100.0 / COUNT(*), 2) as atoll_completion_percent,
    ROUND(COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) * 100.0 / COUNT(*), 2) as name_completion_percent,
    ROUND(COUNT(CASE WHEN profession IS NOT NULL AND profession != '' THEN 1 END) * 100.0 / COUNT(*), 2) as profession_completion_percent
FROM t1;

-- =====================================================
-- 7. SEARCH PATTERN ANALYSIS
-- =====================================================

-- Find entries that might be good test cases for smart search
-- (entries with multiple fields populated)
SELECT 
    pid,
    name,
    party,
    address,
    island,
    atoll,
    profession
FROM t1 
WHERE (party IS NOT NULL AND party != '')
  AND (address IS NOT NULL AND address != '')
  AND (island IS NOT NULL AND island != '')
  AND (atoll IS NOT NULL AND atoll != '')
LIMIT 20;

-- Find entries with potential search conflicts
-- (entries where address might be confused with island)
SELECT 
    pid,
    name,
    address,
    island,
    atoll
FROM t1 
WHERE (address IS NOT NULL AND address != '')
  AND (island IS NOT NULL AND island != '')
  AND (
    LOWER(address) LIKE '%ge%' OR
    LOWER(address) LIKE '%maa%' OR
    LOWER(address) LIKE '%villa%'
  )
LIMIT 20;
