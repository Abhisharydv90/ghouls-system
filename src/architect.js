import fs from 'fs';
import path from 'path';
import swarmBus from './swarmBus.js';
import { GoogleGenAI } from '@google/genai';

// --- THE MULTI-KEY ROTATOR ---
const apiKeys = [
    process.env.GEMINI_API_KEY, 
    process.env.GEMINI_API_KEY_2 // Add your second free key to Render Env Vars
].filter(Boolean); // Filters out undefined keys if you only have 1 active

let currentKeyIndex = 0;

// Dynamic wrapper to fetch the current active key
function getActiveAI() {
    return new GoogleGenAI({ apiKey: apiKeys[currentKeyIndex] });
}

swarmBus.on('architect:parse_prd', async (payload) => {
    const { projectName, prdFileName } = payload;
    const prdPath = path.join(process.cwd(), 'workspace', projectName, prdFileName);

    swarmBus.emit('agent:thought', 'Architect_Agent', `Ingesting PRD from target path: ${prdPath}...`);

    if (!fs.existsSync(prdPath)) {
        swarmBus.emit('agent:thought', 'Architect_Agent', `[CRITICAL]: PRD file not found.`);
        return;
    }

    const prdContent = fs.readFileSync(prdPath, 'utf-8');
    swarmBus.emit('agent:thought', 'Architect_Agent', 'Analyzing structural dependencies using deep semantic reasoning...');

    const systemInstruction = `You are the Lead Systems Architect Agent for Ghouls OS. 
    Your task is to analyze a raw Product Requirement Document (PRD) and break it down into an explicit, sequential JSON execution graph.
    
    CRITICAL RATE-LIMIT CONSTRAINT: You MUST consolidate tasks to minimize downstream API requests. Group all related operations into massive, domain-specific milestones:
    - Milestone 1: Design and write the core Database Schemas/Models in 1 step.
    - Milestone 2: Implement ALL required Backend API Routes/Controllers in 1 unified step.
    - Milestone 3: Develop the complete Frontend UI Dashboard Layout, styling, and components inside 1 single step.
    Strictly enforce a MAXIMUM limit of 4 total steps inside your executionGraph.

    Return ONLY a clean JSON object following this exact schema:
    {
      "projectName": "string",
      "requiredSpecialists": ["string"],
      "executionGraph": [
        { "step": 1, "agent": "string", "action": "WRITE_FILE", "file": "string", "description": "string" }
      ]
    }`;

    let retries = 5; 
    let success = false;

    while (retries > 0 && !success) {
        try {
            if (retries < 5) {
                swarmBus.emit('agent:thought', 'Architect_Agent', `[RETRY LOOP]: Attempting execution path re-entry with Key #${currentKeyIndex + 1}...`);
            }

            // Fetch the currently active AI client
            const ai = getActiveAI();

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Parse this PRD and generate the consolidated system roadmap:\n\n${prdContent}`,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: 'application/json'
                }
            });

            const roadmap = JSON.parse(response.text);
            swarmBus.emit('agent:thought', 'Architect_Agent', `[SUCCESS]: System architecture mapped. Generated ${roadmap.executionGraph.length} macro blueprint steps.`);

            swarmBus.emit('telemetry:pipeline_update', {
                status: 'ARCHITECT_COMPLETE',
                agent: 'Architect_Agent',
                timestamp: new Date().toISOString(),
                roadmap: roadmap
            });

            swarmBus.emit('ceo:initialize_workspace', roadmap);
            success = true;

        } catch (error) {
            retries--;
            
            if (retries === 0) {
                swarmBus.emit('agent:thought', 'Architect_Agent', `[FATAL PARSING ERROR]: ${error.message}`);
            } else {
                // --- SMART FALLBACK: SWAP KEY INSTEAD OF SLEEPING ---
                if (error.message.includes('429') && apiKeys.length > 1) {
                    swarmBus.emit('agent:thought', 'Architect_Agent', `[QUOTA EXHAUSTED]: Key #${currentKeyIndex + 1} burned out. Hot-swapping to backup API key...`);
                    
                    // Rotate to the next key in the array
                    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                    
                    // Tiny 1-second buffer just to clear the event loop before firing again
                    await new Promise(res => setTimeout(res, 1000));
                } else {
                    // If we only have 1 key or it's a different error, use the old wait logic
                    let waitTime = 3000; 
                    const match = error.message.match(/Please retry in (\d+\.?\d*)s/);
                    
                    if (match && match[1]) {
                        waitTime = (parseFloat(match[1]) + 2.5) * 1000;
                        swarmBus.emit('agent:thought', 'Architect_Agent', `[QUOTA BRAKE]: Rate limit hit. Holding pipeline execution for ${Math.ceil(parseFloat(match[1]) + 2.5)}s...`);
                    } else if (error.message.includes('429')) {
                        waitTime = 30000;
                    }
                    await new Promise(res => setTimeout(res, waitTime));
                }
            }
        }
    }
});