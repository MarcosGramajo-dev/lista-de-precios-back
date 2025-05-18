import { pool } from '../config/db.js';

export const getColumnSettings = async (req, res) => {
  try {
    const [columns] = await pool.query(`SELECT column_key, visible FROM column_settings`);
    res.status(200).json(columns);
  } catch (err) {
    console.error('Error loading column settings:', err);
    res.status(500).json({ error: 'Failed to load column settings' });
  }
};

export const updateColumnSetting = async (req, res) => {
  const { key } = req.params;
  const { visible } = req.body;

  try {
    await pool.query(`
      INSERT INTO column_settings (column_key, visible)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE visible = ?;
    `, [key, visible, visible]);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error updating column setting:', err);
    res.status(500).json({ error: 'Failed to update column setting' });
  }
};
