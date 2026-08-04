CREATE DATABASE IF NOT EXISTS pos_system;
USE pos_system;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'cashier') DEFAULT 'cashier',
  admin_key VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  barcode VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash', 'card', 'digital') DEFAULT 'cash',
  status ENUM('completed', 'refunded', 'cancelled') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sale items table
CREATE TABLE sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  voided BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Voided items log
CREATE TABLE voided_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_item_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  reason TEXT,
  voided_by INT NOT NULL,
  admin_approved_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_item_id) REFERENCES sale_items(id),
  FOREIGN KEY (voided_by) REFERENCES users(id),
  FOREIGN KEY (admin_approved_by) REFERENCES users(id)
);

-- Insert default admin
INSERT INTO users (username, password, name, role, admin_key) VALUES 
('admin', '$2a$10$YourHashedPasswordHere', 'System Admin', 'admin', 'ADMIN123');

-- Sample products
INSERT INTO products (name, price, category, barcode) VALUES
('Coca Cola 330ml', 1.50, 'Beverages', '1234567890'),
('French Fries', 3.99, 'Food', '1234567891'),
('Burger Classic', 8.99, 'Food', '1234567892'),
('Mineral Water', 1.00, 'Beverages', '1234567893'),
('Ice Cream', 4.50, 'Dessert', '1234567894');

--Default User Account
INSERT INTO users (username, password, name, role, admin_key) VALUES 
('admin', '$2b$10$P31UsRoM4ROr9vKZyGQMIe/RtxlCIWma5Pxl2jVWgNOEagzEvu/Oe', 'System Admin', 'admin', 'ADMIN123');
-- username "admin", password "admin123", voidKey "ADMIN123"

-- Settings table for POS configuration
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description VARCHAR(255),
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Default POS settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('store_name', 'My Store', 'string', 'Business name shown on receipts'),
('store_address', '123 Main Street', 'string', 'Business address'),
('store_phone', '+1 234 567 890', 'string', 'Contact phone'),
('store_email', 'store@example.com', 'string', 'Contact email'),
('tax_rate', '0', 'number', 'Sales tax percentage (e.g., 12 for 12%)'),
('receipt_header', 'Thank you for shopping!', 'string', 'Message at top of receipt'),
('receipt_footer', 'Please come again!', 'string', 'Message at bottom of receipt'),
('currency_symbol', '$', 'string', 'Currency symbol'),
('enable_tax', 'false', 'boolean', 'Enable tax calculation'),
('receipt_show_change_breakdown', 'true', 'boolean', 'Show change denomination on receipt');