import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import swarmBus from './swarmBus.js';

swarmBus.on('task:browser', async (payload) => {
    const startTime = Date.now();
    const estCost = 0.0020; // Metric baseline tracking for system execution overhead
    
    let targetUrl = typeof payload === 'string' ? payload : payload.url;

    // Direct routing interception matrix
    if (targetUrl.includes('google.com/search')) {
        try {
            const urlObj = new URL(targetUrl);
            const query = urlObj.searchParams.get('q');
            if (query) {
                targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
                swarmBus.emit('agent:thought', 'Browser_Agent', `[STEALTH OVERRIDE]: Rerouting target query vectors to DuckDuckGo...`);
            }
        } catch (e) {
            // Context fallback
        }
    }

    swarmBus.emit('agent:thought', 'Browser_Agent', `Spawning stealth Chromium runtime profile pointing to: ${targetUrl}`);
    
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });
        
        const page = await context.newPage();

        // Evade standard fingerprint automation signatures
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const pageText = await page.evaluate(() => {
            return document.body.innerText.replace(/\s+/g, ' ').trim();
        });

        const cleanText = pageText.substring(0, 15000);

        swarmBus.emit('orchestrator:task_complete', {
            key: 'scrapedData',
            value: cleanText
        });

        const duration = Date.now() - startTime;
        swarmBus.emit('agent:log', 'Browser_Agent', `Successfully processed web vectors. Target content parsed into Shared Memory.`, duration, estCost);
        
    } catch (error) {
        const duration = Date.now() - startTime;
        // Graceful degradation circuit breaker to prevent systemic crashes
        swarmBus.emit('agent:log', 'Browser_Agent', `[GRACEFUL FAILURE]: Scraping transaction failure: ${error.message}`, duration, 0.00);
        swarmBus.emit('orchestrator:error', `Browser_Agent failure context: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});