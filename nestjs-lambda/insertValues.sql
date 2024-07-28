
INSERT INTO carts (id, user_id, status)
VALUES 
    ('899715fc-4ecc-4ef1-aea7-a223ed22adab', 'ec0c8fac-c51e-47b7-84f5-ee07b36c0458', 'OPEN'),
    ('b5f0565a-de80-4c94-859c-4595bb4c07b3', 'd2a51662-ea89-4571-bfb5-edb7add51fb7', 'OPEN');

INSERT INTO cart_items (cart_id, product_id, count)
VALUES 
    ('899715fc-4ecc-4ef1-aea7-a223ed22adab', '7e2027c1-d28d-4bf4-8895-556fdabeec98', 2),
    ('b5f0565a-de80-4c94-859c-4595bb4c07b3', '71109853-50a5-458c-88b3-239057eb6c66', 3);
    
    
