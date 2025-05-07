CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY,
    wallet_id UUID,
    transaction_type ENUM('deposit', 'withdrawal', 'transfer', 'payment'),
    description TEXT,
    amount DECIMAL(18, 4),
    transaction_fee DECIMAL(12, 4) DEFAULT 0.0000,
    source_currency CHAR(3),
    destination_currency CHAR(3),
    exchange_rate DECIMAL(10, 6),
    transaction_status ENUM('initiated', 'completed', 'failed', 'reversed'),
    initiated_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id)
);

CREATE TABLE accounts (
    account_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    account_type ENUM('savings', 'checking', 'credit', 'loan'),
    account_number VARCHAR(20) UNIQUE,
    balance DECIMAL(12, 2),
    currency_code CHAR(3) DEFAULT 'SGD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);