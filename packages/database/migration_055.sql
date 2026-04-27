-- migration_055: Add os_name and device_name columns to user_sessions for better session display
ALTER TABLE user_sessions ADD COLUMN os_name VARCHAR(100) NULL AFTER user_agent;
ALTER TABLE user_sessions ADD COLUMN device_name VARCHAR(150) NULL AFTER os_name;
