-- =====================================================
-- INSERT EXAMPLE CONTRACTS AND DAMAGES FOR TESTING
-- =====================================================
-- This script creates example contracts and damage points
-- for the cars in the fleet to demonstrate the system

-- Note: You'll need to have at least one user in your users table
-- You can get this by running: SELECT id FROM public.users LIMIT 1;

-- First, let's create some example contracts for our fleet
-- We'll use the license plates from our cars

-- =====================================================
-- CONTRACTS FOR FIAT PANDA HYBRID (ΖΤΖ4206) - RENTED
-- =====================================================
INSERT INTO public.contracts (
  id,
  user_id,
  renter_full_name,
  renter_id_number,
  renter_tax_id,
  renter_driver_license_number,
  renter_phone_number,
  renter_email,
  renter_address,
  pickup_date,
  pickup_time,
  pickup_location,
  dropoff_date,
  dropoff_time,
  dropoff_location,
  is_different_dropoff_location,
  total_cost,
  car_make_model,
  car_year,
  car_license_plate,
  car_mileage,
  fuel_level,
  insurance_type
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.users LIMIT 1),
  'Γιώργος Παπαδόπουλος',
  'ΑΒ123456',
  '123456789',
  'DL987654321',
  '+30 6912345678',
  'g.papadopoulos@example.com',
  'Λεωφ. Συγγρού 123, Αθήνα',
  '2024-01-15 10:00:00',
  '10:00',
  'Πειραιάς',
  '2024-01-20 10:00:00',
  '10:00',
  'Πειραιάς',
  false,
  210.00,
  'Fiat Panda Hybrid',
  2024,
  'ΖΤΖ4206',
  15000,
  8,
  'full'
);

-- Add damage points for this contract
INSERT INTO public.damage_points (
  contract_id,
  x_position,
  y_position,
  view_side,
  description,
  severity
) VALUES
  ('11111111-1111-1111-1111-111111111111', 45.2, 32.1, 'front', 'Μικρή γρατζουνιά στον προφυλακτήρα από πάρκινγκ.', 'minor'),
  ('11111111-1111-1111-1111-111111111111', 70.3, 58.5, 'right', 'Μικρό βαθούλωμα στην πόρτα συνοδηγού.', 'moderate');

-- =====================================================
-- CONTRACTS FOR PEUGEOT 208 (ΧΗΖ6448) - RENTED
-- =====================================================
INSERT INTO public.contracts (
  id,
  user_id,
  renter_full_name,
  renter_id_number,
  renter_tax_id,
  renter_driver_license_number,
  renter_phone_number,
  renter_email,
  renter_address,
  pickup_date,
  pickup_time,
  pickup_location,
  dropoff_date,
  dropoff_time,
  dropoff_location,
  is_different_dropoff_location,
  total_cost,
  car_make_model,
  car_year,
  car_license_plate,
  car_mileage,
  fuel_level,
  insurance_type
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.users LIMIT 1),
  'Μαρία Κωνσταντίνου',
  'ΑΓ234567',
  '234567890',
  'DL876543210',
  '+30 6923456789',
  'maria.k@example.com',
  'Πατησίων 45, Αθήνα',
  '2024-02-01 14:00:00',
  '14:00',
  'Πειραιάς',
  '2024-02-10 14:00:00',
  '14:00',
  'Πειραιάς',
  false,
  468.00,
  'Peugeot 208',
  2024,
  'ΧΗΖ6448',
  22000,
  7,
  'basic'
);

-- Add damage points for this contract
INSERT INTO public.damage_points (
  contract_id,
  x_position,
  y_position,
  view_side,
  description,
  severity
) VALUES
  ('22222222-2222-2222-2222-222222222222', 30.5, 50.0, 'rear', 'Ράγισμα στο πίσω φανάρι δεξιά.', 'severe'),
  ('22222222-2222-2222-2222-222222222222', 55.7, 25.4, 'left', 'Γρατζουνιά κατά μήκος του πίσω φτερού.', 'moderate');

-- =====================================================
-- CONTRACTS FOR CITROEN C3 (ΒΜΖ1133) - RENTED
-- =====================================================
INSERT INTO public.contracts (
  id,
  user_id,
  renter_full_name,
  renter_id_number,
  renter_tax_id,
  renter_driver_license_number,
  renter_phone_number,
  renter_email,
  renter_address,
  pickup_date,
  pickup_time,
  pickup_location,
  dropoff_date,
  dropoff_time,
  dropoff_location,
  is_different_dropoff_location,
  total_cost,
  car_make_model,
  car_year,
  car_license_plate,
  car_mileage,
  fuel_level,
  insurance_type
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  (SELECT id FROM public.users LIMIT 1),
  'Νίκος Αθανασίου',
  'ΑΔ345678',
  '345678901',
  'DL765432109',
  '+30 6934567890',
  'nikos.a@example.com',
  'Ερμού 78, Αθήνα',
  '2024-01-25 09:00:00',
  '09:00',
  'Πειραιάς',
  '2024-02-05 09:00:00',
  '09:00',
  'Πειραιάς',
  false,
  715.00,
  'Citroen C3',
  2025,
  'ΒΜΖ1133',
  18000,
  6,
  'full'
);

-- Add damage points for this contract
INSERT INTO public.damage_points (
  contract_id,
  x_position,
  y_position,
  view_side,
  description,
  severity
) VALUES
  ('33333333-3333-3333-3333-333333333333', 40.1, 60.2, 'front', 'Μικρό σημάδι από χαλίκι στο καπό.', 'minor'),
  ('33333333-3333-3333-3333-333333333333', 65.8, 45.7, 'right', 'Μέτρια φθορά στο χρώμα από επαφή με άλλο όχημα.', 'moderate');

-- =====================================================
-- CONTRACTS FOR FIAT PANDA (XEH1056) - RENTED
-- =====================================================
INSERT INTO public.contracts (
  id,
  user_id,
  renter_full_name,
  renter_id_number,
  renter_tax_id,
  renter_driver_license_number,
  renter_phone_number,
  renter_email,
  renter_address,
  pickup_date,
  pickup_time,
  pickup_location,
  dropoff_date,
  dropoff_time,
  dropoff_location,
  is_different_dropoff_location,
  total_cost,
  car_make_model,
  car_year,
  car_license_plate,
  car_mileage,
  fuel_level,
  insurance_type
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.users LIMIT 1),
  'Ελένη Δημητρίου',
  'ΑΕ456789',
  '456789012',
  'DL654321098',
  '+30 6945678901',
  'eleni.d@example.com',
  'Βουλής 12, Αθήνα',
  '2024-02-10 11:00:00',
  '11:00',
  'Πειραιάς',
  '2024-02-17 11:00:00',
  '11:00',
  'Πειραιάς',
  false,
  266.00,
  'Fiat Panda',
  2022,
  'XEH1056',
  45000,
  8,
  'basic'
);

-- Add damage points for this contract
INSERT INTO public.damage_points (
  contract_id,
  x_position,
  y_position,
  view_side,
  description,
  severity
) VALUES
  ('44444444-4444-4444-4444-444444444444', 25.3, 70.0, 'rear', 'Σπάσιμο στη γωνία του προφυλακτήρα.', 'severe'),
  ('44444444-4444-4444-4444-444444444444', 50.0, 40.5, 'left', 'Ξεθώριασμα στο χρώμα από τον ήλιο.', 'minor');

-- =====================================================
-- CONTRACTS FOR KIA PICANTO (ΙΥΥ5733) - RENTED
-- =====================================================
INSERT INTO public.contracts (
  id,
  user_id,
  renter_full_name,
  renter_id_number,
  renter_tax_id,
  renter_driver_license_number,
  renter_phone_number,
  renter_email,
  renter_address,
  pickup_date,
  pickup_time,
  pickup_location,
  dropoff_date,
  dropoff_time,
  dropoff_location,
  is_different_dropoff_location,
  total_cost,
  car_make_model,
  car_year,
  car_license_plate,
  car_mileage,
  fuel_level,
  insurance_type
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  (SELECT id FROM public.users LIMIT 1),
  'Κώστας Βασιλείου',
  'ΑΖ567890',
  '567890123',
  'DL543210987',
  '+30 6956789012',
  'kostas.v@example.com',
  'Ακαδημίας 56, Αθήνα',
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  '15:00',
  'Πειραιάς',
  CURRENT_TIMESTAMP + INTERVAL '4 days',
  '15:00',
  'Πειραιάς',
  false,
  315.00,
  'Kia Picanto',
  2021,
  'ΙΥΥ5733',
  12000,
  7,
  'full'
);

-- Add damage point for this contract
INSERT INTO public.damage_points (
  contract_id,
  x_position,
  y_position,
  view_side,
  description,
  severity
) VALUES
  ('55555555-5555-5555-5555-555555555555', 45.0, 28.0, 'front', 'Μικρή γρατζουνιά κάτω από το φανάρι.', 'minor');

-- =====================================================
-- CONTRACTS FOR MITSUBISHI SPACESTAR (XPI1202) - AVAILABLE
-- =====================================================
INSERT INTO public.contracts (
  id,
  user_id,
  renter_full_name,
  renter_id_number,
  renter_tax_id,
  renter_driver_license_number,
  renter_phone_number,
  renter_email,
  renter_address,
  pickup_date,
  pickup_time,
  pickup_location,
  dropoff_date,
  dropoff_time,
  dropoff_location,
  is_different_dropoff_location,
  total_cost,
  car_make_model,
  car_year,
  car_license_plate,
  car_mileage,
  fuel_level,
  insurance_type
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  (SELECT id FROM public.users LIMIT 1),
  'Σοφία Γεωργίου',
  'ΑΗ678901',
  '678901234',
  'DL432109876',
  '+30 6967890123',
  'sofia.g@example.com',
  'Σταδίου 34, Αθήνα',
  '2024-01-10 12:00:00',
  '12:00',
  'Πειραιάς',
  '2024-01-18 12:00:00',
  '12:00',
  'Πειραιάς',
  false,
  336.00,
  'Mitsubishi Spacestar',
  2025,
  'XPI1202',
  5000,
  8,
  'basic'
);

-- Add damage points for this contract
INSERT INTO public.damage_points (
  contract_id,
  x_position,
  y_position,
  view_side,
  description,
  severity
) VALUES
  ('66666666-6666-6666-6666-666666666666', 35.5, 75.2, 'rear', 'Ράγισμα στο πίσω φτερό από μικρή σύγκρουση.', 'moderate'),
  ('66666666-6666-6666-6666-666666666666', 60.3, 50.0, 'right', 'Γρατζουνιά στην πίσω πόρτα συνοδηγού.', 'minor');

-- =====================================================
-- CONTRACTS FOR MG ZS (XHE7736) - AVAILABLE
-- =====================================================
INSERT INTO public.contracts (
  id,
  user_id,
  renter_full_name,
  renter_id_number,
  renter_tax_id,
  renter_driver_license_number,
  renter_phone_number,
  renter_email,
  renter_address,
  pickup_date,
  pickup_time,
  pickup_location,
  dropoff_date,
  dropoff_time,
  dropoff_location,
  is_different_dropoff_location,
  total_cost,
  car_make_model,
  car_year,
  car_license_plate,
  car_mileage,
  fuel_level,
  insurance_type
) VALUES (
  '77777777-7777-7777-7777-777777777777',
  (SELECT id FROM public.users LIMIT 1),
  'Δημήτρης Ιωάννου',
  'ΑΘ789012',
  '789012345',
  'DL321098765',
  '+30 6978901234',
  'dimitris.i@example.com',
  'Πανεπιστημίου 89, Αθήνα',
  '2023-12-20 10:00:00',
  '10:00',
  'Πειραιάς',
  '2024-01-05 10:00:00',
  '10:00',
  'Πειραιάς',
  false,
  1152.00,
  'MG ZS',
  2024,
  'XHE7736',
  8000,
  6,
  'full'
);

-- Add damage points for this contract
INSERT INTO public.damage_points (
  contract_id,
  x_position,
  y_position,
  view_side,
  description,
  severity
) VALUES
  ('77777777-7777-7777-7777-777777777777', 28.0, 35.5, 'front', 'Σημάδια από χαλίκια στο καπό.', 'minor'),
  ('77777777-7777-7777-7777-777777777777', 75.0, 60.2, 'left', 'Βαθούλωμα στην πίσω πόρτα οδηγού.', 'moderate'),
  ('77777777-7777-7777-7777-777777777777', 40.5, 85.0, 'rear', 'Μικρό σπάσιμο στο πίσω φανάρι.', 'severe');

-- =====================================================
-- CONTRACTS FOR SUZUKI CELERIO (BKA9814) - AVAILABLE
-- =====================================================
INSERT INTO public.contracts (
  id,
  user_id,
  renter_full_name,
  renter_id_number,
  renter_tax_id,
  renter_driver_license_number,
  renter_phone_number,
  renter_email,
  renter_address,
  pickup_date,
  pickup_time,
  pickup_location,
  dropoff_date,
  dropoff_time,
  dropoff_location,
  is_different_dropoff_location,
  total_cost,
  car_make_model,
  car_year,
  car_license_plate,
  car_mileage,
  fuel_level,
  insurance_type
) VALUES (
  '88888888-8888-8888-8888-888888888888',
  (SELECT id FROM public.users LIMIT 1),
  'Αννα Χριστοδούλου',
  'ΑΙ890123',
  '890123456',
  'DL210987654',
  '+30 6989012345',
  'anna.ch@example.com',
  'Κολοκοτρώνη 23, Αθήνα',
  '2024-02-05 16:00:00',
  '16:00',
  'Πειραιάς',
  '2024-02-12 16:00:00',
  '16:00',
  'Πειραιάς',
  false,
  245.00,
  'Suzuki Celerio',
  2021,
  'BKA9814',
  28000,
  8,
  'basic'
);

-- Add damage point for this contract
INSERT INTO public.damage_points (
  contract_id,
  x_position,
  y_position,
  view_side,
  description,
  severity
) VALUES
  ('88888888-8888-8888-8888-888888888888', 55.5, 30.2, 'right', 'Μικρή γρατζουνιά από πόρτα διπλανού οχήματος.', 'minor');

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script creates:
-- - 8 example contracts across different cars in the fleet
-- - 16 damage points with various severities
-- - Mix of active and completed contracts (note: status is not in schema, managed by dates)
-- - Realistic Greek descriptions and data
-- - Proper mileage tracking
-- - Fuel level tracking
-- - Insurance type (basic/full)

-- To verify the data was inserted correctly, run:
-- SELECT COUNT(*) FROM public.contracts;
-- SELECT COUNT(*) FROM public.damage_points;
-- SELECT c.car_license_plate, COUNT(dp.id) as damage_count 
-- FROM public.contracts c 
-- LEFT JOIN public.damage_points dp ON c.id = dp.contract_id 
-- GROUP BY c.car_license_plate 
-- ORDER BY damage_count DESC;
