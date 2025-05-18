import puppeteer from 'puppeteer';

/**
 * Convierte claves de objeto a camelCase sin tildes ni símbolos raros.
 */
const normalizeAttributes = (atributosRaw) => {
  const atributosLimpiados = {};

  for (const [key, value] of Object.entries(atributosRaw)) {
    const cleanKey = key
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, '') // elimina tildes
      .replace(/[^a-zA-Z0-9 ]/g, '')   // elimina símbolos
      .split(' ')
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');

    atributosLimpiados[cleanKey] = value;
  }

  return atributosLimpiados;
};

export const scrapeProductInfo = async (url) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  try {
    await page.waitForSelector('.andes-money-amount__fraction', { timeout: 5000 });

    const rawData = await page.evaluate(() => {
      const precioText = document.querySelector('.andes-money-amount__fraction')?.textContent || '0';
      const precio_compra = parseFloat(precioText.replace(/[^\d]/g, ''));

      const vendedor = document.querySelector('.ui-seller-data-header__title-container h2')?.textContent.trim() || 'Desconocido';

      const headerElems = Array.from(document.querySelectorAll('.andes-table__header__container'));
      const valueElems = Array.from(document.querySelectorAll('.andes-table__column--value'));

      const atributos = {};
      for (let i = 0; i < Math.min(headerElems.length, valueElems.length); i++) {
        const key = headerElems[i]?.textContent.trim();
        const value = valueElems[i]?.textContent.trim();
        if (key && value) {
          atributos[key] = value;
        }
      }

      return {
        precio_compra: isNaN(precio_compra) ? 0 : precio_compra,
        vendedor,
        atributos,
      };
    });

    // Normalizamos las claves de atributos
    const atributosLimpios = normalizeAttributes(rawData.atributos);

    return {
      precio_compra: rawData.precio_compra,
      vendedor: rawData.vendedor,
      atributos: atributosLimpios,
    };
  } catch (error) {
    console.error('❌ Error en el scraping:', error);
    return {
      precio_compra: 0,
      vendedor: 'Error scraping',
      atributos: {},
    };
  } finally {
    await browser.close();
  }
};
