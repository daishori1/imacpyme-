CREATE DATA BASE imac;

CREATE TABLE vendors 
(vendor_id INTEGER  GENERATED ALWAYS  AS IDENTITY PRIMARY KEY , name VARCHAR(30) NOT NULL ,email varchar (30) NOT NULL UNIQUE, phone VARCHAR(30) , active BOOLEAN , create_at 
TIMESTAMP DEFAULT CURRENT_TIMESTAMP);



CREATE TABLE users 
(users_id INTEGER GENERATED ALWAYS  AS IDENTITY PRIMARY KEY , name VARCHAR(30) NOT NULL ,
 email VARCHAR(30) NOT NULL UNIQUE , phone VARCHAR(30) ,rol VARCHAR(30)NOT NULL,active BOOLEAN , create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);



CREATE TABLE stock 

(item_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY , product_name varchar(30)NOT NULL, 
serial_number VARCHAR(30) NOT NULL, brand VARCHAR(30) NOT NULL , 
stock NUMERIC NOT NULL ,cost NUMERIC NOT NULL,owner VARCHAR(30) NOR NULL, location VARCHAR (30) ,
 vendor INTERGER , FOREIGN KEY (vendor) REFERENCES vendors(vendor_id) , users_id INTEGER NOT NULL , FOREIGN KEY (users_id) REFERENCES users(users_id) 
 , create_at TIMESTAMP DEFAULT CURRRENT_TIMESTAMP);



---- constrains added to the code to continue with the data integrity --

ALTER TABLE stock 
ADD CONSTRAINT stock_cost_nonnegative 
CHECK (cost >= 0 ;)

ALTER TABLE stock 
ADD CONSTRAINT stock_amount_nonnegative
CHECK (stock >=0) ; 
-- test example - 
INSERT INTO users   (name,phone,email,rol,active) values ('ramon lozano','3326121199','wairu63@gmail.com','data base admin',TRUE) ;

--dumie test vendor--
-- Vendor único
INSERT INTO vendors (name, email, phone, active) VALUES
('TechSupply MX', 'ventas@techsupply.mx', '3312345678', TRUE);

-- Registros 1 al 14: altas nuevas en stock (vendor = 1, users_id = 1)
INSERT INTO stock (product_name, serial_number, brand, stock, cost, owner, location, vendor, users_id) VALUES
('Laptop Dell Latitude', 'SN-0001', 'Dell', 10, 8500.00, 'Almacén General', 'Bodega A', 1, 1),
('Monitor LG 24"', 'SN-0002', 'LG', 15, 2300.00, 'Almacén General', 'Bodega A', 1, 1),
('Teclado Logitech K120', 'SN-0003', 'Logitech', 30, 250.00, 'Almacén General', 'Bodega B', 1, 1),
('Mouse Logitech M100', 'SN-0004', 'Logitech', 40, 150.00, 'Almacén General', 'Bodega B', 1, 1),
('Diadema Jabra Evolve', 'SN-0005', 'Jabra', 20, 1200.00, 'Almacén General', 'Bodega A', 1, 1),
('Webcam Logitech C920', 'SN-0006', 'Logitech', 12, 1100.00, 'Almacén General', 'Bodega A', 1, 1),
('Router TP-Link AX1500', 'SN-0007', 'TP-Link', 8, 950.00, 'Almacén General', 'Bodega C', 1, 1),
('Switch 8 puertos', 'SN-0008', 'TP-Link', 6, 700.00, 'Almacén General', 'Bodega C', 1, 1),
('Cable HDMI 2m', 'SN-0009', 'Steren', 50, 90.00, 'Almacén General', 'Bodega B', 1, 1),
('Cable UTP Cat6 (caja)', 'SN-0010', 'Steren', 10, 1300.00, 'Almacén General', 'Bodega C', 1, 1),
('Impresora HP LaserJet', 'SN-0011', 'HP', 5, 3200.00, 'Almacén General', 'Bodega A', 1, 1),
('Disco SSD 480GB', 'SN-0012', 'Kingston', 25, 650.00, 'Almacén General', 'Bodega B', 1, 1),
('Memoria RAM 8GB DDR4', 'SN-0013', 'Kingston', 35, 480.00, 'Almacén General', 'Bodega B', 1, 1),
('UPS 750VA', 'SN-0014', 'APC', 9, 1450.00, 'Almacén General', 'Bodega C', 1, 1);

--update stock -- 
UPDATE stock SET stock = stock - 3 WHERE serial_number = 'SN-0001'; -- 15
UPDATE stock SET stock = stock + 10 WHERE serial_number = 'SN-0009'; -- 16
UPDATE stock SET stock = stock - 2 WHERE serial_number = 'SN-0011'; -- 17
UPDATE stock SET stock = stock - 5 WHERE serial_number = 'SN-0013'; -- 18
UPDATE stock SET stock = stock + 4 WHERE serial_number = 'SN-0007'; -- 19
UPDATE stock SET stock = stock - 1 WHERE serial_number = 'SN-0014'; -- 20