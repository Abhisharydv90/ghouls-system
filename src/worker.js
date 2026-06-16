import swarmBus from './swarmBus.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// --- THE MULTI-KEY ROTATOR ---
const apiKeys = [
    process.env.GEMINI_API_KEY, 
    process.env.GEMINI_API_KEY_2 // Ingesting the backup key from Render Env Vars
].filter(Boolean); // Filters out undefined if only 1 key is present

let currentKeyIndex = 0;

// Dynamic wrapper to fetch the current active key model
function getActiveAI() {
    const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

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
                        swarmBus.emit('agent:thought', roleName, `[RETRY LOOP]: Attempting execution path re-entry with Key #${currentKeyIndex + 1}... (${retries} attempts remaining)`);
                    } else {
                        swarmBus.emit('agent:thought', roleName, `Compiling architecture execution via Gemini Engine...`);
                    }

                    // Dynamically fetch the active model instance before requesting
                    const ai = getActiveAI();
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
                        // --- SMART FALLBACK: SWAP KEY INSTEAD OF SLEEPING ---
                        if (error.message.includes('429') && apiKeys.length > 1) {
                            swarmBus.emit('agent:thought', roleName, `[QUOTA EXHAUSTED]: Key #${currentKeyIndex + 1} burned out. Hot-swapping to backup API key...`);
                            
                            // Rotate to the next key in the array
                            currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                            
                            // Tiny 1-second buffer to clear the event loop before firing again
                            await new Promise(res => setTimeout(res, 1000));
                        } else {
                            // If we only have 1 key or it's a 503 error, fall back to sleep logic
                            let waitTime = 3000; 
                            const match = error.message.match(/Please retry in (\d+\.?\d*)s/);
                            
                            if (match && match[1]) {
                                waitTime = (parseFloat(match[1]) + 2.5) * 1000;
                                swarmBus.emit('agent:thought', roleName, `[QUOTA BRAKE]: Rate limit hit. Holding pipeline execution for ${Math.ceil(parseFloat(match[1]) + 2.5)}s to reset API windows...`);
                            } else if (error.message.includes('429')) {
                                waitTime = 30000;
                                swarmBus.emit('agent:thought', roleName, `[QUOTA BRAKE]: Rate limit hit. Using 30s safety fallback pause...`);
                            }

                            // Sleep the current worker thread
                            await new Promise(res => setTimeout(res, waitTime));
                        }
                    }
                }
            }
        });
    }
}

const workerPool = new DynamicWorkerPool();
export default workerPool;