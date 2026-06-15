import swarmBus from './swarmBus.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const ai = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

class DynamicWorkerPool {
    constructor() {
        this.activeWorkers = new Set();
        this.interceptBus();
    }

    // Bulletproof Interceptor: Catches ANY agent execution call instantly
    interceptBus() {
        const originalEmit = swarmBus.emit;
        const self = this;

        swarmBus.emit = function (event, ...args) {
            if (typeof event === 'string' && event.startsWith('agent:execute:')) {
                const roleName = event.replace('agent:execute:', '');
                self.registerWorker(roleName);
            }
            return originalEmit.apply(this, [event, ...args]);
        };
    }

    registerWorker(roleName) {
        if (this.activeWorkers.has(roleName)) return;
        this.activeWorkers.add(roleName);

        swarmBus.on(`agent:execute:${roleName}`, async (payload) => {
            swarmBus.emit('agent:thought', roleName, `Ingesting task parameters: ${payload.task?.description || 'Executing system blueprint architecture.'}`);
            
            try {
                const prompt = `
                You are acting as the specialized ${roleName} for the project: ${payload.project || 'Lead Gen SaaS'}.
                Your current task: ${payload.task?.description || 'Generate structural blueprints or code foundations.'}
                
                CRITICAL INSTRUCTION FOR UI PREVIEW ENGINE: 
                If you are generating UI or layout code, you MUST output ONLY valid, raw HTML. 
                Include Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) in the <head>.
                Include Lucide Icons via CDN or use standard SVGs.
                Apply dark mode (bg-gray-950) and glassmorphism (bg-opacity-20, backdrop-blur) as requested.
                
                DO NOT wrap your response in markdown code blocks (e.g., \`\`\`html). Return ONLY the raw code string so the iframe preview can render it immediately.
                `;

                swarmBus.emit('agent:thought', roleName, `Compiling architecture execution via Gemini Engine...`);

                const result = await ai.generateContent(prompt);
                let codeOutput = result.response.text();
                
                codeOutput = codeOutput.replace(/```html/g, '').replace(/```javascript/g, '').replace(/```/g, '').trim();

                swarmBus.emit('orchestrator:step_complete', {
                    agent: roleName,
                    output: codeOutput
                });

            } catch (error) {
                swarmBus.emit('orchestrator:step_failed', {
                    agent: roleName,
                    error: error.message,
                    file: 'dynamic_generation_error'
                });
            }
        });
    }
}

const workerPool = new DynamicWorkerPool();
export default workerPool;