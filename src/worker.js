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

            let retries = 3;
            let success = false;

            while (retries > 0 && !success) {
                try {
                    const prompt = `
                    You are acting as the specialized ${roleName} for the project: ${payload.project || 'Lead Gen SaaS'}.
                    Your current task: ${payload.task?.description || 'Generate structural blueprints or code foundations.'}
                    
                    CRITICAL INSTRUCTIONS:
                    1. If the task is UI/Frontend related, output ONLY valid, raw HTML starting with <html>. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) and Lucide Icons. Apply dark mode (bg-gray-950) and glassmorphism.
                    2. If the task is Backend, Database, or CLI initialization (like npx create-next-app), output the raw code or shell commands clearly.
                    3. DO NOT wrap your response in markdown code blocks (like \`\`\`html or \`\`\`bash). Do not include conversational filler. Just the code.
                    `;

                    if (retries < 3) {
                        swarmBus.emit('agent:thought', roleName, `[AUTO-RETRY ENGINE]: Bypassing API bottleneck. Re-attempting execution... (${retries} attempts left)`);
                    } else {
                        swarmBus.emit('agent:thought', roleName, `Compiling architecture execution via Gemini Engine...`);
                    }

                    const result = await ai.generateContent(prompt);
                    let codeOutput = result.response.text();
                    
                    // Scrub out any rogue markdown the LLM tries to sneak in
                    codeOutput = codeOutput.replace(/```html/g, '').replace(/```javascript/g, '').replace(/```bash/g, '').replace(/```/g, '').trim();

                    swarmBus.emit('orchestrator:step_complete', {
                        agent: roleName,
                        output: codeOutput
                    });
                    
                    success = true; // Break the loop if successful

                } catch (error) {
                    retries--;
                    // Explicitly broadcast the exact API error to the frontend terminal
                    swarmBus.emit('agent:log', roleName, `[API ERROR CAUGHT]: ${error.message}`);

                    if (retries === 0) {
                        swarmBus.emit('orchestrator:step_failed', {
                            agent: roleName,
                            error: error.message,
                            file: 'dynamic_generation_error'
                        });
                    } else {
                        // Exponential backoff: Wait 2.5 seconds before hitting the API again
                        await new Promise(res => setTimeout(res, 2500));
                    }
                }
            }
        });
    }
}

const workerPool = new DynamicWorkerPool();
export default workerPool;