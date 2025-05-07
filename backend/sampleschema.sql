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