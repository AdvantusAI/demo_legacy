
-- Create the sequence first
CREATE SEQUENCE company_config_id_seq;

-- Set the sequence to be owned by the id column
ALTER SEQUENCE company_config_id_seq OWNED BY company_config.id;

-- Set the default value for the id column to use the sequence
ALTER TABLE company_config ALTER COLUMN id SET DEFAULT nextval('company_config_id_seq');

-- Set the sequence to start from the next available number
SELECT setval('company_config_id_seq', COALESCE((SELECT MAX(id) FROM company_config), 0) + 1);
