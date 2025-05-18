import { pool } from '../config/db.js';
import { scrapeProductInfo } from '../services/scraper.service.js';

export const createOrUpdateItem = async (req, res) => {
  try {
    const { modelo, stock, porcentaje_ganancia, url, marca, vendedor, precio_compra } = req.body;

    let productId;
    let finalPrecioCompra = precio_compra;
    let finalMarca = marca;
    let finalVendedor = vendedor;

    // Si viene una URL, usamos scraping
    if (url) {
      const scraped = await scrapeProductInfo(url);
      finalPrecioCompra = scraped.precio_compra;
      finalMarca = scraped.atributos?.marca || scraped.marca || null;
      finalVendedor = scraped.vendedor;

      // Buscar producto por URL
      const [rows] = await pool.query('SELECT id FROM products WHERE url = ?', [url]);

      if (rows.length > 0) {
        productId = rows[0].id;

        await pool.query(
          `UPDATE products SET 
            modelo = ?, stock = ?, porcentaje_ganancia = ?, 
            marca = ?, vendedor = ?, updated_at = NOW()
          WHERE id = ?`,
          [modelo, stock, porcentaje_ganancia, finalMarca, finalVendedor, productId]
        );
      } else {
        const [insertResult] = await pool.query(
          `INSERT INTO products (modelo, url, marca, vendedor, stock, porcentaje_ganancia)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [modelo, url, finalMarca, finalVendedor, stock, porcentaje_ganancia]
        );
        productId = insertResult.insertId;
      }
    } else {
      // Sin URL → carga manual (marca, vendedor y precio_compra son obligatorios)
      if (!marca || !vendedor || !precio_compra) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para carga manual (marca, vendedor, precio_compra)' });
      }

      const [insertResult] = await pool.query(
        `INSERT INTO products (modelo, url, marca, vendedor, stock, porcentaje_ganancia)
         VALUES (?, NULL, ?, ?, ?, ?)`,
        [modelo, finalMarca, finalVendedor, stock, porcentaje_ganancia]
      );
      productId = insertResult.insertId;
    }

    // Calcular precio de venta
    const precio_venta = finalPrecioCompra * (1 + porcentaje_ganancia / 100);

    // Insertar historial de precios
    await pool.query(
      `INSERT INTO product_prices (product_id, precio_compra, precio_venta)
       VALUES (?, ?, ?)`,
      [productId, finalPrecioCompra, precio_venta]
    );

    res.status(200).json({ success: true, product_id: productId });
  } catch (error) {
    console.error('Error al crear o actualizar item:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getItems = async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT 
        p.id,
        p.modelo,
        p.url,
        p.marca,
        p.vendedor,
        p.stock,
        p.porcentaje_ganancia,
        p.updated_at,
        pp.precio_compra,
        pp.precio_venta,
        pp.registrado_en
      FROM products p
      LEFT JOIN (
        SELECT product_id, precio_compra, precio_venta, registrado_en
        FROM product_prices
        WHERE (product_id, registrado_en) IN (
          SELECT product_id, MAX(registrado_en)
          FROM product_prices
          GROUP BY product_id
        )
      ) pp ON pp.product_id = p.id
      ORDER BY p.updated_at DESC

    `);

    res.status(200).json(items);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getItemPrices = async (req, res) => {
  const { id } = req.params;

  try {
    const [prices] = await pool.query(
      `SELECT id, precio_compra, precio_venta, registrado_en
       FROM product_prices
       WHERE product_id = ?
       ORDER BY registrado_en DESC`,
      [id]
    );

    res.status(200).json(prices);
  } catch (error) {
    console.error('Error al obtener historial de precios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateItem = async (req, res) => {
  const { id } = req.params;
  const {
    modelo,
    stock,
    porcentaje_ganancia,
    url,
    marca,
    vendedor,
    precio_compra
  } = req.body;

  try {
    // Actualizar producto
    await pool.query(
      `UPDATE products SET
        modelo = ?,
        stock = ?,
        porcentaje_ganancia = ?,
        url = ?,
        marca = ?,
        vendedor = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        modelo,
        stock,
        porcentaje_ganancia,
        url || null,
        marca || null,
        vendedor || null,
        id
      ]
    );

    // Insertar en historial de precios solo si el valor es válido
    const precioCompraNum = parseFloat(precio_compra);
    const isValidPrice = !isNaN(precioCompraNum) && precioCompraNum > 0;

    if (isValidPrice) {
      const precio_venta = precioCompraNum * (1 + porcentaje_ganancia / 100);

      await pool.query(
        `INSERT INTO product_prices (product_id, precio_compra, precio_venta)
         VALUES (?, ?, ?)`,
        [id, precioCompraNum, precio_venta]
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


