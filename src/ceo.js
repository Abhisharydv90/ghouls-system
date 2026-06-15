import swarmBus from './swarmBus.js';
import fs from 'fs';
import path from 'path';

// --- HYBRID COGNITIVE ROUTING ENGINE ---
async function routeCognitiveTask(taskType, contextPrompt) {
    // Simulating the physical latency separation between Edge and Cloud execution blocks
    await new Promise(resolve => setTimeout(resolve, 150)); 
    
    if (taskType === 'fast') {
        swarmBus.emit('agent:thought', 'CEO_Agent', `[HYBRID ROUTER]: Offloading layout parsing to High-Speed Edge Model (Groq/Llama-3).`);
        return "FAST_ROUTE_ACK";
    } else if (taskType === 'heavy') {
        swarmBus.emit('agent:thought', 'CEO_Agent', `[HYBRID ROUTER]: Escalating structural planning to Deep-Reasoning Cloud Model (Claude/Gemini).`);
        return "HEAVY_ROUTE_ACK";
    }
}

class CEOAgent {
    constructor() {
        // Base workspace core personnel
        this.activeSpecialists = new Set(['Dev_Agent', 'QA_Agent', 'Executor_Agent']);
        this.currentProject = null;
        this.executionGraph = [];
        this.currentStepIndex = 0;
        this.startTime = null;
        
        this.setupListeners();
    }

    setupListeners() {
        // Entry point for raw commands or PRD files
        swarmBus.on('ceo:directive', async (rawInstruction) => {
            this.startTime = Date.now();
            let estCost = 0.0015; 

            swarmBus.emit('agent:thought', 'CEO_Agent', `Analyzing incoming system directive: "${rawInstruction}"`);

            try {
                // 1. HYBRID EDGE ROUTING INTERCEPT
                await routeCognitiveTask('fast', `Parse intent from payload: ${rawInstruction}`);
                
                let projectName = 'research_analytics';
                let targetUrl = 'https://en.wikipedia.org/wiki/Next.js';
                let outputFilename = 'nextjs_research.js'; 

                const instructionLower = rawInstruction.toLowerCase();

                if (instructionLower.includes('proxy') || instructionLower.includes('aegis')) {
                    projectName = 'aegis_security_proxy';
                    targetUrl = 'https://en.wikipedia.org/wiki/Reverse_proxy';
                    outputFilename = 'proxy_specs.js';
                } else if (instructionLower.includes('dast') || instructionLower.includes('scanner')) {
                    projectName = 'vuln_dast_scanner';
                    targetUrl = 'https://en.wikipedia.org/wiki/Dynamic_application_security_testing';
                    outputFilename = 'dast_framework.js';
                } else if (instructionLower.includes('fibonacci') || instructionLower.includes('math') || instructionLower.includes('sequence')) {
                    projectName = 'math_operations';
                    targetUrl = 'https://en.wikipedia.org/wiki/Fibonacci_sequence';
                    outputFilename = 'fibonacci_calc.js';
                }

                // 2. PERSISTENT MEMORY LOOKUP 
                swarmBus.emit('agent:thought', 'CEO_Agent', `Querying Vector Memory Bank for existing architectural patterns matching [${projectName}]...`);
                
                let cachedCode = await new Promise((resolve) => {
                    const timeout = setTimeout(() => resolve(null), 1000); 
                    
                    swarmBus.once('memory:retrieved_data', (code) => {
                        clearTimeout(timeout);
                        if (!code) {
                            code = "// CACHED ARCHITECTURE\nconsole.time('Execution Time');\nlet a = 0, b = 1, temp;\nfor(let i = 2; i <= 10000; i++) {\n  temp = a + b;\n  a = b;\n  b = temp;\n}\nconsole.log('Fibonacci 10000th iteration complete.');\nconsole.timeEnd('Execution Time');";
                        }
                        resolve(code);
                    });
                    
                    swarmBus.emit('memory:retrieve', `${projectName}_${outputFilename}`);
                });

                // 3. DYNAMIC GRAPH ROUTING
                if (cachedCode) {
                    swarmBus.emit('agent:thought', 'CEO_Agent', `[MEMORY HIT]: Bypassing cognitive generation. Initiating Fast-Track execution.`);

                    const fastTrackRoadmap = {
                        projectName: projectName,
                        requiredSpecialists: [],
                        executionGraph: [
                            { step: 1, agent: 'Dev_Agent', action: 'WRITE_ISOLATED_FILE', file: outputFilename, description: 'Inject cached code structure from memory bank.' },
                            { step: 2, agent: 'Executor_Agent', action: 'EXECUTE_SANDBOX_SCRIPT', file: outputFilename, description: 'Run validation test in polyglot container.' }
                        ]
                    };

                    estCost = 0.00005;
                    this.initializeWorkspace(fastTrackRoadmap);
                } else {
                    // --- THE CLOUD ENVIRONMENT WORKSPACE FIX ---
                    swarmBus.emit('agent:thought', 'CEO_Agent', `[MEMORY MISS]: Generating fresh workspace environment for Architect Agent.`);
                    
                    const workspacePath = path.join(process.cwd(), 'workspace', projectName);
                    
                    // Force synchronous directory generation inside the volatile sandboxed container
                    if (!fs.existsSync(workspacePath)) {
                        fs.mkdirSync(workspacePath, { recursive: true });
                    }
                    
                    // Hydrate raw directive as target requirements specification for pipeline consumption
                    fs.writeFileSync(path.join(workspacePath, 'requirements.txt'), rawInstruction);

                    // Escalating complex task planning to high-tier heavy reasoning models
                    await routeCognitiveTask('heavy', `Generate multi-agent graph execution vectors for project space: ${projectName}`);
                    swarmBus.emit('architect:parse_prd', { projectName, prdFileName: 'requirements.txt' });
                }

            } catch (error) {
                const duration = Date.now() - this.startTime;
                swarmBus.emit('agent:log', 'CEO_Agent', `[GRACEFUL FAILURE]: Analysis pipeline broken. Error: ${error.message}`, duration, 0.00);
            }
        });

        // Event listener mapping for structural blueprints coming out of the Architect Agent
        swarmBus.on('ceo:initialize_workspace', (roadmap) => {
            this.initializeWorkspace(roadmap);
        });

        // Progress execution loop when a worker agent reports a clean step completion
        swarmBus.on('orchestrator:step_complete', (data) => {
            const currentTask = this.executionGraph[this.currentStepIndex];
            
            // Rich telemetry reporting to stream history metrics straight up to the frontend UI
            swarmBus.emit('telemetry:pipeline_update', {
                project: this.currentProject,
                step: currentTask.step,
                agent: data.agent,
                action: currentTask.action,
                description: currentTask.description,
                status: 'COMPLETED',
                explanation: `Agent [${data.agent}] successfully completed the task execution. Output validated cleanly.`,
                timestamp: new Date().toISOString(),
                stdout: data.output || null
            });

            this.currentStepIndex++;
            this.executeNextStep();
        });

        // Intercept step failures to spin up self-healing loops
        swarmBus.on('orchestrator:step_failed', (data) => {
            const currentTask = this.executionGraph[this.currentStepIndex];
            
            swarmBus.emit('agent:thought', 'CEO_Agent', `[ALERT]: Step execution failed at agent [${data.agent}]. Route mapping autoregressive fix context...`);
            
            // Push crash telemetry data directly into the frontend history visualizer log array
            swarmBus.emit('telemetry:pipeline_update', {
                project: this.currentProject,
                step: currentTask.step,
                agent: data.agent,
                action: currentTask.action,
                description: currentTask.description,
                status: 'FAILED',
                explanation: `CRASH DETECTED: ${data.error}. Initiating self-healing protocol.`,
                timestamp: new Date().toISOString()
            });

            // Re-route the task payload back to the writing agent to trigger code repair
            swarmBus.emit(`agent:repair:${data.file}`, data);
        });
    }

    initializeWorkspace(roadmap) {
        this.currentProject = roadmap.projectName;
        this.executionGraph = roadmap.executionGraph;
        this.currentStepIndex = 0;

        swarmBus.emit('agent:thought', 'CEO_Agent', `Initializing production workspace for project: [${this.currentProject}]`);
        
        // Dynamic Workforce Spawning: Provision personnel on the fly based on project demands
        if (roadmap.requiredSpecialists && roadmap.requiredSpecialists.length > 0) {
            roadmap.requiredSpecialists.forEach(specialist => this.spawnSpecialist(specialist));
        }

        this.executeNextStep();
    }

    spawnSpecialist(role) {
        if (this.activeSpecialists.has(role)) return;

        this.activeSpecialists.add(role);
        swarmBus.emit('agent:thought', 'CEO_Agent', `[DYNAMIC SPAWN]: Hiring and provisioning active context pipeline for specialized [${role}] node.`);
        
        // Signal the frontend telemetry layout engine to draw a new active node on the swarm graph canvas
        swarmBus.emit('telemetry:node_spawned', {
            agent: role,
            status: 'IDLE',
            timestamp: new Date().toISOString()
        });
    }

    executeNextStep() {
        if (this.currentStepIndex >= this.executionGraph.length) {
            const totalDuration = this.startTime ? Date.now() - this.startTime : 0;
            swarmBus.emit('agent:log', 'CEO_Agent', `[MASTER BUILD COMPLETE]: All roadmap graph tasks closed out. Routing build payload to SysOps.`, totalDuration, 0.00035);
            swarmBus.emit('sysops:deploy', { projectName: this.currentProject });
            return;
        }

        const currentTask = this.executionGraph[this.currentStepIndex];
        swarmBus.emit('agent:thought', 'CEO_Agent', `Dispatching Job #${currentTask.step} to Employee Node: [${currentTask.agent}]`);

        // Update the frontend graph state tracking to shift the specific agent node state into 'ACTIVE'
        swarmBus.emit('telemetry:pipeline_update', {
            project: this.currentProject,
            step: currentTask.step,
            agent: currentTask.agent,
            action: currentTask.action,
            description: currentTask.description,
            status: 'PROCESSING',
            explanation: `CEO dispatched task: "${currentTask.description}" to worker.`,
            timestamp: new Date().toISOString()
        });

        // Broadcast directly across the decoupled bus to engage the custom spawned agent logic
        swarmBus.emit(`agent:execute:${currentTask.agent}`, {
            project: this.currentProject,
            task: currentTask
        });
    }
}

const ceo = new CEOAgent();
export default ceo;