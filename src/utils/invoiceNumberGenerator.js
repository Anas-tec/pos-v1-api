// backend/src/utils/invoiceNumberGenerator.js

/**
 * Generate a unique sequential invoice number for the given company
 * Format: INV-YYYYMMDD-XXXX (e.g., INV-20260829-0001)
 * @param {import('pg').PoolClient} client - Transactional database client
 * @param {string|number} companyId 
 * @returns {Promise<string>}
 */
async function generateInvoiceNumber(client, companyId) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;

  // Query latest invoice for this company and date pattern
  const query = `
    SELECT invoice_number 
    FROM pos_v1.invoices 
    WHERE company_id = $1 AND invoice_number LIKE $2
    ORDER BY id DESC 
    LIMIT 1 
    FOR UPDATE;
  `;
  const result = await client.query(query, [companyId, `${prefix}%`]);

  let nextSequence = 1;
  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].invoice_number;
    const parts = lastNumber.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) {
        nextSequence = seq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}

module.exports = {
  generateInvoiceNumber,
};
