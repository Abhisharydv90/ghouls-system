import fs from 'fs';
import path from 'path';
import swarmBus from './swarmBus.js';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    
    CRITICAL RATE-LIMIT CONSTRAINT: You MUST consolidate tasks to minimize downstream API requests. Do NOT generate micro-steps or separate files for individual sections. Group all related operations into massive, domain-specific milestones:
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

    // --- SMART AUTO-RETRY ARMOR ---
    let retries = 5; 
    let success = false;

    while (retries > 0 && !success) {
        try {
            if (retries < 5) {
                swarmBus.emit('agent:thought', 'Architect_Agent', `[RETRY LOOP]: Attempting execution path re-entry... (${retries} attempts remaining)`);
            }

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

            // Stream telemetry to frontend timeline visualizer
            swarmBus.emit('telemetry:pipeline_update', {
                status: 'ARCHITECT_COMPLETE',
                agent: 'Architect_Agent',
                timestamp: new Date().toISOString(),
                roadmap: roadmap
            });

            // Handoff to CEO to begin workforce spawning and step execution
            swarmBus.emit('ceo:initialize_workspace', roadmap);
            
            success = true;

        } catch (error) {
            retries--;
            
            if (retries === 0) {
                // We completely ran out of retries, throw the fatal error
                swarmBus.emit('agent:thought', 'Architect_Agent', `[FATAL PARSING ERROR]: ${error.message}`);
            } else {
                // --- DYNAMIC RATE-LIMIT PARSER ---
                let waitTime = 3000; 
                const match = error.message.match(/Please retry in (\d+\.?\d*)s/);
                
                if (match && match[1]) {
                    waitTime = (parseFloat(match[1]) + 2.5) * 1000;
                    swarmBus.emit('agent:thought', 'Architect_Agent', `[QUOTA BRAKE]: Rate limit hit. Holding pipeline execution for ${Math.ceil(parseFloat(match[1]) + 2.5)}s to reset API windows...`);
                } else if (error.message.includes('429')) {
                    waitTime = 30000;
                    swarmBus.emit('agent:thought', 'Architect_Agent', `[QUOTA BRAKE]: Rate limit hit. Using 30s safety fallback pause...`);
                }

                // Sleep the Architect thread
                await new Promise(res => setTimeout(res, waitTime));
            }
        }
    }
});