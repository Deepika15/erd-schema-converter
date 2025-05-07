CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number INT(7),
    date_of_birth DATE,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
    wallet_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    currency CHAR(3) NOT NULL,
    balance DECIMAL(18, 4) DEFAULT 0.0,
    status ENUM('active', 'frozen') DEFAULT 'active',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY,
    wallet_id UUID NOT NULL,
    transaction_type ENUM('credit', 'debit', 'transfer', 'payment') NOT NULL,
    amount DECIMAL(18, 4),
    currency CHAR(3),
    status ENUM('initiated', 'completed', 'failed') DEFAULT 'initiated',
    description TEXT,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id)
);