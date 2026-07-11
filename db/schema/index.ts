export const initialSchema = `
  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    merchant TEXT NOT NULL,
    category TEXT NOT NULL,
    total_amount REAL NOT NULL,
    scan_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS receipt_details (
    id TEXT PRIMARY KEY,
    receipt_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES receipts (id) ON DELETE CASCADE
  );
`;