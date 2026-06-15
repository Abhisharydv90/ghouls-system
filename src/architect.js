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

    try {
        swarmBus.emit('agent:thought', 'Architect_Agent', 'Analyzing structural dependencies using deep semantic reasoning...');

        const systemInstruction = `You are the Lead Systems Architect Agent for Ghouls OS. 
        Your task is to analyze a raw Product Requirement Document (PRD) and break it down into an explicit, sequential JSON execution graph.
        Identify the technical stack required, the database models, backend API routes, and frontend UI views.
        Return ONLY a clean JSON object following this exact schema:
        {
          "projectName": "string",
          "requiredSpecialists": ["string"],
          "executionGraph": [
            { "step": 1, "agent": "string", "action": "WRITE_FILE", "file": "string", "description": "string" }
          ]
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Parse this PRD and generate the system roadmap:\n\n${prdContent}`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json'
            }
        });

        const roadmap = JSON.parse(response.text);
        swarmBus.emit('agent:thought', 'Architect_Agent', `[SUCCESS]: System architecture mapped. Generated ${roadmap.executionGraph.length} blueprint steps.`);

        // Stream telemetry to frontend timeline visualizer
        swarmBus.emit('telemetry:pipeline_update', {
            status: 'ARCHITECT_COMPLETE',
            agent: 'Architect_Agent',
            timestamp: new Date().toISOString(),
            roadmap: roadmap
        });

        // Handoff to CEO to begin workforce spawning and step execution
        swarmBus.emit('ceo:initialize_workspace', roadmap);

    } catch (error) {
        swarmBus.emit('agent:thought', 'Architect_Agent', `[FATAL PARSING ERROR]: ${error.message}`);
    }
});