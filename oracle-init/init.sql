-- Oracle Autonomous Database initialization script
-- This script creates the necessary tables and indexes for the Finance Tracker application

-- Create accounts table
CREATE TABLE accounts (
    id VARCHAR2(36) DEFAULT SYS_GUID() PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    type VARCHAR2(50) NOT NULL CHECK (type IN ('deposits', 'investments')),
    category VARCHAR2(255) NOT NULL,
    description CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create monthly_entries table
CREATE TABLE monthly_entries (
    id VARCHAR2(36) DEFAULT SYS_GUID() PRIMARY KEY,
    account_id VARCHAR2(36) NOT NULL,
    month VARCHAR2(7) NOT NULL CHECK (REGEXP_LIKE(month, '^[0-9]{4}-[0-9]{2}$')),
    amount NUMBER(15,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT uk_account_month UNIQUE (account_id, month)
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_name_type ON accounts(name, type);
CREATE INDEX idx_entries_month ON monthly_entries(month);
CREATE INDEX idx_entries_account_month ON monthly_entries(account_id, month);

-- Create triggers to automatically update the updated_at timestamp
CREATE OR REPLACE TRIGGER accounts_update_trigger
    BEFORE UPDATE ON accounts
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER entries_update_trigger
    BEFORE UPDATE ON monthly_entries
    FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Insert sample data for testing (optional)
-- You can uncomment these lines to insert sample accounts and entries

/*
INSERT INTO accounts (id, name, type, category, description) VALUES 
    ('sample-1', 'Checking Account', 'deposits', 'Checking', 'Primary checking account'),
    ('sample-2', 'Stock Portfolio', 'investments', 'Stocks', 'Investment portfolio');

INSERT INTO monthly_entries (id, account_id, month, amount) VALUES 
    ('entry-1', 'sample-1', '2024-01', 5000.00),
    ('entry-2', 'sample-2', '2024-01', 25000.00);
*/

COMMIT;

-- Display success message
SELECT 'Finance Tracker database initialization completed successfully!' AS status FROM dual;