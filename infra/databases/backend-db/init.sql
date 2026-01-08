-- Initial users for backend database
-- This script is executed automatically when PostgreSQL starts for the first time

-- Insert initial users (only if they don't exist)
INSERT INTO users (email, password, name, role, created_at) VALUES
  ('admin@example.com', '$2b$10$Nkntdhghajml3edGWucny.xSRRLId2nv70E7hKzvjEQsythcN.ZpC', 'Admin User', 'admin', NOW()),
  ('moder@example.com', '$2b$10$RnWxr3HzK4KVuAv854g/k.AiwlFKaT/NDQQuulMkF1EzxvqNsmxn6', 'Moderator User', 'moderator', NOW()),
  ('user@example.com', '$2b$10$4INUj5alxEjHmoM/szXUBeIMDLowl42WnqOxJoULh.3qDFmnj/e9.', 'Regular User', 'user', NOW())
ON CONFLICT (email) DO NOTHING;

