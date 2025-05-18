import { scrapeProductInfo } from '../services/scraper.service.js';

// Usá una URL real de MercadoLibre o de tu proveedor
const testURL = 'https://articulo.mercadolibre.com.ar/MLA-848122456-radiador-de-agua-chevrolet-corsa-classic-spirit-14-or3201-_JM#polycard_client=search-nordic&position=6&search_layout=stack&type=item&tracking_id=cf5e6b69-4753-49e6-95f8-8f844049d6ec&wid=MLA848122456&sid=search'; // ⬅️ reemplazar

(async () => {
  console.log(`Scrapeando: ${testURL}\n`);

  const result = await scrapeProductInfo(testURL);

  console.log('📦 Resultado obtenido:\n', result);
})();
