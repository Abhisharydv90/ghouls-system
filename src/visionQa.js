import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import swarmBus from './swarmBus.js';

// Initialize Gemini (Using the Multimodal Vision Model)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function captureScreenshot(htmlFilePath) {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // Set a modern desktop viewport for accurate UI testing
    await page.setViewport({ width: 1440, height: 900 });
    
    // Load the local HTML/React build file directly into the headless browser
    const fileUrl = `file://${htmlFilePath}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Capture the UI to a base64 string
    const screenshotBase64 = await page.screenshot({ encoding: 'base64', fullPage: true });
    await browser.close();
    
    return screenshotBase64;
}

swarmBus.on('agent:execute:Vision_QA_Agent', async (payload) => {
    const { project, task } = payload;
    const targetFile = task.file;
    const workspacePath = path.join(process.cwd(), 'workspace', project);
    const filePath = path.join(workspacePath, targetFile);

    swarmBus.emit('agent:thought', 'Vision_QA_Agent', `Booting headless Chromium engine to visually inspect [${targetFile}]...`);

    if (!fs.existsSync(filePath)) {
        swarmBus.emit('orchestrator:step_failed', { 
            agent: 'Vision_QA_Agent', 
            error: `Cannot verify visually. File missing: ${filePath}`, 
            file: targetFile 
        });
        return;
    }

    try {
        // 1. Take the photograph of the UI
        const imageBase64 = await captureScreenshot(filePath);
        swarmBus.emit('agent:thought', 'Vision_QA_Agent', `UI Snapshot captured. Engaging Multimodal Pixel Analysis...`);

        // 2. Multimodal LLM Aesthetic & Layout Inspection
        const systemPrompt = `You are the Lead UI/UX Vision QA Engineer. 
        Analyze the provided screenshot of the web interface. 
        Look for: Overlapping elements, broken CSS flexbox/grid layouts, ugly default browser styling, and bad contrast.
        If the UI looks modern, clean, and properly aligned, return exactly: "PASS".
        If the UI is broken or ugly, return exactly: "FAIL", followed by a strict, detailed explanation of what CSS/HTML the Dev Agent needs to fix.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Multimodal model
            contents: [
                { text: systemPrompt },
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: imageBase64
                    }
                }
            ]
        });

        const evaluation = response.text.trim();

        // 3. Routing the Visual Feedback
        if (evaluation.startsWith('PASS')) {
            swarmBus.emit('agent:thought', 'Vision_QA_Agent', `[VISUAL QA PASSED]: Layout is pixel-perfect and aesthetic constraint met.`);
            
            swarmBus.emit('telemetry:pipeline_update', {
                status: 'COMPLETED',
                agent: 'Vision_QA_Agent',
                timestamp: new Date().toISOString(),
                stdout: 'Visual verification cleared.',
                stderr: null
            });

            swarmBus.emit('orchestrator:step_complete', {
                agent: 'Vision_QA_Agent',
                project: project,
                file: targetFile
            });
        } else {
            const feedbackLog = evaluation.replace('FAIL', '').trim();
            swarmBus.emit('agent:thought', 'Vision_QA_Agent', `[VISUAL QA FAILED]: UI layout rejected. Booting autoregressive CSS repair loop...`);
            
            swarmBus.emit('telemetry:pipeline_update', {
                status: 'CRASHED',
                agent: 'Vision_QA_Agent',
                timestamp: new Date().toISOString(),
                stdout: null,
                stderr: feedbackLog
            });

            // Kick the visual feedback straight back to the Dev Agent to fix its code
            swarmBus.emit('orchestrator:step_failed', {
                agent: 'Vision_QA_Agent',
                error: `Visual QA Rejected the UI layout. Fix the following CSS/Structure issues:\n${feedbackLog}`,
                project: project,
                file: targetFile
            });
        }

    } catch (error) {
        swarmBus.emit('agent:thought', 'Vision_QA_Agent', `[FATAL QA EXCEPTION]: ${error.message}`);
        swarmBus.emit('orchestrator:step_failed', { 
            agent: 'Vision_QA_Agent', 
            error: error.message, 
            file: targetFile 
        });
    }
});