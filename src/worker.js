import swarmBus from './swarmBus.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the Flash model for high-speed coding
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
        // Prevent duplicate brains if the CEO hires the same role twice
        if (this.activeWorkers.has(roleName)) return;
        this.activeWorkers.add(roleName);

        // Create a dedicated listener for this newly hired role
        swarmBus.on(`agent:execute:${roleName}`, async (payload) => {
            swarmBus.emit('agent:thought', roleName, `Ingesting task parameters: ${payload.task?.description || 'Executing system blueprint architecture.'}`);

            // Increased default retries to 5 to survive long sequential swarm builds
            let retries = 5; 
            let success = false;

            while (retries > 0 && !success) {
                try {
                    const prompt = `
                    You are acting as the specialized ${roleName} for the project: ${payload.project || 'Lead Gen SaaS'}.
                    Your current task: ${payload.task?.description || 'Generate structural blueprints or code foundations.'}
                    
                    CRITICAL INSTRUCTIONS:
                    1. If the task is UI/Frontend related, output ONLY valid, raw HTML starting with <html>. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) and Lucide Icons. Apply dark mode (bg-gray-950) and glassmorphism.
                    2. If the task is Backend, Database, or CLI initialization, output the raw code or shell commands clearly.
                    3. DO NOT wrap your response in markdown code blocks (like \`\`\`html or \`\`\`bash). Just the clean output.
                    `;

                    if (retries < 5) {
                        swarmBus.emit('agent:thought', roleName, `[RETRY LOOP]: Attempting execution path re-entry... (${retries} attempts remaining)`);
                    } else {
                        swarmBus.emit('agent:thought', roleName, `Compiling architecture execution via Gemini Engine...`);
                    }

                    const result = await ai.generateContent(prompt);
                    let codeOutput = result.response.text();
                    
                    // SAFE SCRUBBER: Uses replaceAll instead of regex to prevent file breaking on deploy
                    codeOutput = codeOutput.replaceAll('```html', '').replaceAll('```javascript', '').replaceAll('```bash', '').replaceAll('```', '').trim();

                    swarmBus.emit('orchestrator:step_complete', {
                        agent: roleName,
                        output: codeOutput
                    });
                    
                    success = true; // Break the loop if successful

                } catch (error) {
                    retries--;
                    swarmBus.emit('agent:log', roleName, `[API CONGESTION]: ${error.message}`);

                    if (retries === 0) {
                        swarmBus.emit('orchestrator:step_failed', {
                            agent: roleName,
                            error: error.message,
                            file: 'dynamic_generation_error'
                        });
                    } else {
                        // Smart backoff default
                        let waitTime = 3000; 

                        // DYNAMIC PARSER: Look for "Please retry in X.XXXXs" in the Google API error message
                        const match = error.message.match(/Please retry in (\d+\.?\d*)s/);
                        if (match && match[1]) {
                            // Extract seconds, convert to MS, and add a 2.5-second safety buffer
                            waitTime = (parseFloat(match[1]) + 2.5) * 1000;
                            swarmBus.emit('agent:thought', roleName, `[QUOTA BRAKE]: Rate limit hit. Holding pipeline execution for ${Math.ceil(parseFloat(match[1]) + 2.5)}s to reset API windows...`);
                        } else if (error.message.includes('429')) {
                            // Fallback if regex fails but status is still a 429 rate limit
                            waitTime = 30000;
                            swarmBus.emit('agent:thought', roleName, `[QUOTA BRAKE]: Rate limit hit. Using 30s safety fallback pause...`);
                        }

                        // Sleep the current worker thread
                        await new Promise(res => setTimeout(res, waitTime));
                    }
                }
            }
        });
    }
}

const workerPool = new DynamicWorkerPool();
export default workerPool;