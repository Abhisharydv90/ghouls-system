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
        
        // Listen for the CEO hiring a new agent
        swarmBus.on('telemetry:node_spawned', (data) => {
            this.registerWorker(data.agent);
        });
    }

    registerWorker(roleName) {
        // Prevent duplicate brains if the CEO hires the same role twice
        if (this.activeWorkers.has(roleName)) return;
        this.activeWorkers.add(roleName);

        // Create a dedicated listener for this newly hired role
        swarmBus.on(`agent:execute:${roleName}`, async (payload) => {
            swarmBus.emit('agent:thought', roleName, `Ingesting task parameters: ${payload.task.description}`);
            
            try {
                // The master prompt that forces Live Preview compatibility
                const prompt = `
                You are acting as the specialized ${roleName} for the project: ${payload.project}.
                Your current task: ${payload.task.description}
                
                CRITICAL INSTRUCTION FOR UI PREVIEW ENGINE: 
                If you are a Frontend Engineer or writing UI, you MUST output ONLY valid, raw HTML. 
                You must include Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) in the <head>.
                You must include Lucide Icons via CDN or use standard SVGs.
                Apply dark mode (bg-gray-950) and glassmorphism (bg-opacity-20, backdrop-blur) as requested.
                
                DO NOT wrap your response in markdown blocks (e.g., \`\`\`html). Return ONLY the raw code string starting with <html> or the required syntax so the iframe can render it immediately.
                `;

                swarmBus.emit('agent:thought', roleName, `Compiling code artifacts via Gemini Engine...`);

                const result = await ai.generateContent(prompt);
                let codeOutput = result.response.text();
                
                // Safety cleanup: Strip markdown if the LLM disobeys the prompt
                codeOutput = codeOutput.replace(/```html/g, '').replace(/```javascript/g, '').replace(/```/g, '').trim();

                // Fire the completion event back to the CEO and pass the code to the Frontend UI
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