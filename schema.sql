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