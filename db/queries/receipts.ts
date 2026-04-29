import * as crypto from 'expo-crypto';
import { db, queryAll } from '../index';

export interface ReceiptItem {
  name: string;
  price: number;
  qty: number;
}

export interface ReceiptPayload {
  merchant: string;
  category: string;
  totalAmount: number;
  scanDate: string;
  items: ReceiptItem[];
}

export async function insertReceiptWithDetails(payload: ReceiptPayload) {
  const receiptId = crypto.randomUUID();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO receipts (id, merchant, category, total_amount, scan_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [receiptId, payload.merchant, payload.category, payload.totalAmount, payload.scanDate]
    );

    for (const item of payload.items) {
      const detailId = crypto.randomUUID();

      await db.runAsync(
        `INSERT INTO receipt_details (id, receipt_id, item_name, price, quantity) 
         VALUES (?, ?, ?, ?, ?)`,
        [detailId, receiptId, item.name, item.price, item.qty]
      );
    }
  });

  return receiptId;
}

export async function getRecentReceipts(limit: number = 10) {
  return await queryAll<any>(
    `SELECT * FROM receipts ORDER BY scan_date DESC LIMIT ?`,
    [limit]
  );
}

export async function getReceiptDetails(receiptId: string) {
  return await queryAll<any>(
    `SELECT * FROM receipt_details WHERE receipt_id = ?`,
    [receiptId]
  );
}

export async function getReceiptById(receiptId: string) {
  try {
    return await db.getFirstAsync<any>(
      `SELECT * FROM receipts WHERE id = ?`,
      [receiptId]
    );
  } catch (err) {
    console.error("Error fetching receipt by ID:", err);
    throw err;
  }
}

export async function deleteReceipt(receiptId: string) {
  try {
    return await db.runAsync(
      `DELETE FROM receipts WHERE id = ?`,
      [receiptId]
    );
  } catch (err) {
    console.error("Error deleting receipt:", err);
    throw err;
  }
}