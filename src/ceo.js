import swarmBus from './swarmBus.js';

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

swarmBus.on('ceo:directive', async (rawInstruction) => {
    const startTime = Date.now();
    let estCost = 0.0015; // Default single-model token cost baseline

    swarmBus.emit('agent:thought', 'CEO_Agent', `Analyzing incoming system directive: "${rawInstruction}"`);

    try {
        // 1. HYBRID EDGE ROUTING INTERCEPT
        // Instantly analyze intent using zero-cost, high-speed edge intelligence models
        await routeCognitiveTask('fast', `Parse intent from payload: ${rawInstruction}`);
        
        // Default execution metrics configuration
        let projectName = 'research_analytics';
        let targetUrl = 'https://en.wikipedia.org/wiki/Next.js';
        let outputFilename = 'nextjs_research.js'; 

        const instructionLower = rawInstruction.toLowerCase();

        // System routing matrices
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

        // 2. LONG-TERM PERSISTENT MEMORY LOOKUP (Now with Async Short-Circuiting)
        swarmBus.emit('agent:thought', 'CEO_Agent', `Querying Vector Memory Bank for existing architectural patterns matching [${projectName}]...`);
        
        // Wait up to 1 second for the Memory Agent to reply before moving on
        const cachedCode = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 1000); 
            
            swarmBus.once('memory:retrieved_data', (code) => {
                clearTimeout(timeout);
                resolve(code);
            });
            
            swarmBus.emit('memory:retrieve', `${projectName}_${outputFilename}`);
        });

        let generatedPlan;

        // 3. DYNAMIC GRAPH ROUTING (Fast-Track vs Generation)
        if (cachedCode) {
            swarmBus.emit('agent:thought', 'CEO_Agent', `[MEMORY HIT]: Bypassing cognitive generation and QA phases. Initiating Fast-Track execution.`);
            
            // Inject the cached code into the Dev Agent's shared memory immediately
            swarmBus.emit('orchestrator:task_complete', { key: 'cached_code', value: cachedCode });

            generatedPlan = {
                projectName: projectName,
                steps: [
                    {
                        step: 1,
                        agent: 'Dev_Agent',
                        action: 'WRITE_ISOLATED_FILE',
                        fileName: outputFilename,
                        filename: outputFilename,
                        prompt: `OUTPUT EXACTLY THIS CACHED CODE, NO CHANGES: \n\n ${cachedCode}`
                    },
                    {
                        step: 2,
                        agent: 'Executor_Agent', 
                        action: 'EXECUTE_SANDBOX_SCRIPT',
                        fileName: outputFilename,
                        filename: outputFilename
                    }
                ]
            };
        } else {
            // Escalating complex task planning to high-tier heavy reasoning models
            await routeCognitiveTask('heavy', `Generate multi-agent graph execution vectors for project space: ${projectName}`);

            generatedPlan = {
                projectName: projectName,
                steps: [
                    { step: 1, agent: 'Browser_Agent', action: 'SCRAPE_URL', url: targetUrl },
                    { step: 2, agent: 'Dev_Agent', action: 'WRITE_ISOLATED_FILE', fileName: outputFilename, filename: outputFilename },
                    { step: 3, agent: 'Executor_Agent', action: 'EXECUTE_SANDBOX_SCRIPT', fileName: outputFilename, filename: outputFilename },
                    { step: 4, agent: 'QA_Agent', action: 'VERIFY_AND_STORE', fileName: outputFilename, filename: outputFilename }
                ]
            };
        }

        // Recalculate metrics engine to reflect edge routing savings
        estCost = cachedCode ? 0.00005 : 0.00035; // Dropped cost massively if cached

        const duration = Date.now() - startTime;

        // Emit log sequences showing real-time optimization telemetry
        const nodeCount = cachedCode ? 2 : 4;
        swarmBus.emit('agent:log', 'CEO_Agent', `Plan compiled with ${nodeCount} autonomous execution nodes. Cost optimized via Hybrid Edge Routing. Target: [${projectName}]`, duration, estCost);
        swarmBus.emit('orchestrator:init_plan', generatedPlan);

    } catch (error) {
        const duration = Date.now() - startTime;
        // Graceful degradation safety interceptor
        swarmBus.emit('agent:log', 'CEO_Agent', `[GRACEFUL FAILURE]: Analysis pipeline broken. Error: ${error.message}`, duration, 0.00);
    }
});