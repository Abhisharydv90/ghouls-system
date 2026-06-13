import swarmBus from './swarmBus.js';

swarmBus.on('ceo:directive', async (rawInstruction) => {
    const startTime = Date.now();
    const estCost = 0.0015; // Base token cost estimation for metrics engine

    swarmBus.emit('agent:thought', 'CEO_Agent', `Analyzing incoming system directive: "${rawInstruction}"`);

    try {
        let projectName = 'research_analytics';
        let targetUrl = 'https://en.wikipedia.org/wiki/Next.js';
        let outputFilename = 'nextjs_research.txt';

        const instructionLower = rawInstruction.toLowerCase();

        // System routing matrices
        if (instructionLower.includes('proxy') || instructionLower.includes('aegis')) {
            projectName = 'aegis_security_proxy';
            targetUrl = 'https://en.wikipedia.org/wiki/Reverse_proxy';
            outputFilename = 'proxy_specs.txt';
        } else if (instructionLower.includes('dast') || instructionLower.includes('scanner')) {
            projectName = 'vuln_dast_scanner';
            targetUrl = 'https://en.wikipedia.org/wiki/Dynamic_application_security_testing';
            outputFilename = 'dast_framework.txt';
        }

        const generatedPlan = {
            projectName: projectName,
            steps: [
                {
                    step: 1,
                    agent: 'Browser_Agent',
                    action: 'SCRAPE_URL',
                    url: targetUrl
                },
                {
                    step: 2,
                    agent: 'Dev_Agent',
                    action: 'WRITE_ISOLATED_FILE',
                    filename: outputFilename
                }
            ]
        };

        // Artificial micro-delay to mimic engine analysis overhead for accurate log sorting
        await new Promise(resolve => setTimeout(resolve, 200));

        const duration = Date.now() - startTime;

        // Emit logs complete with duration and cost performance metrics
        swarmBus.emit('agent:log', 'CEO_Agent', `Plan compiled for workflow execution environment: [${projectName}]`, duration, estCost);
        swarmBus.emit('orchestrator:init_plan', generatedPlan);

    } catch (error) {
        const duration = Date.now() - startTime;
        // Graceful degradation safety interceptor
        swarmBus.emit('agent:log', 'CEO_Agent', `[GRACEFUL FAILURE]: Analysis pipeline broken. Error: ${error.message}`, duration, 0.00);
    }
});