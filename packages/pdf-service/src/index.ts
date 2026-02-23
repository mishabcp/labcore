/**
 * Minimal PDF service: accepts HTML and returns PDF buffer.
 * Callable from the API (in-process or via HTTP in future).
 */

import puppeteer from 'puppeteer';

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
// Allow running as a simple HTTP server for local testing (optional)
const PORT = process.env.PDF_SERVICE_PORT ?? 3002;

if (require.main === module) {
  const http = require('http');
  const server = http.createServer(async (req: any, res: any) => {
    if (req.method === 'POST' && req.url === '/pdf') {
      let body = '';
      for await (const chunk of req) body += chunk;
      try {
        const pdf = await htmlToPdf(body);
        res.writeHead(200, { 'Content-Type': 'application/pdf' });
        res.end(pdf);
      } catch (e) {
        res.writeHead(500);
        res.end(String((e as Error).message));
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  server.listen(PORT, () => console.log(`PDF service on http://localhost:${PORT}`));
}

  }
}
