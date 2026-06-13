import fs from 'fs';
import path from 'path';
import swarmBus from './swarmBus.js';

swarmBus.on('task:dev', async (payload) => {
    const startTime = Date.now();
    const estCost = 0.0030; // Metric baseline tracking for compilation compute overhead

    const projectName = payload.projectName || 'default_project';
    const filename = payload.filename || 'output.txt';
    const incomingData = payload.sharedMemory?.scrapedData || 'No input context found in Shared Memory state.';

    swarmBus.emit('agent:thought', 'Dev_Agent', `Compiling files for workspace project context: [${projectName}]`);

    try {
        const workspaceRoot = path.join(process.cwd(), 'workspace');
        const projectDirectory = path.join(workspaceRoot, projectName);

        if (!fs.existsSync(workspaceRoot)) {
            fs.mkdirSync(workspaceRoot);
        }
        if (!fs.existsSync(projectDirectory)) {
            fs.mkdirSync(projectDirectory);
        }

        const targetFilePath = path.join(projectDirectory, filename);

        let parsedSummary = incomingData;
        
        // Custom Ghouls OS Buffer Formatting
        if (incomingData.length > 500) {
            parsedSummary = `====================================================================\n` +
                            ` GHOULS OS PARSED ARCHIVE // LOG MATRIX\n` +
                            ` PROJECT COMPILATION ENGINE: ${projectName.toUpperCase()}\n` +
                            `====================================================================\n\n` +
                            `${incomingData.substring(0, 5000)}\n\n` +
                            `[END OF AUTOMATED COMPILED CONTEXT BUFFER]`;
        }

        // Artificial micro-delay to simulate complex compilation routines for telemetry scaling
        await new Promise(resolve => setTimeout(resolve, 800));

        fs.writeFileSync(targetFilePath, parsedSummary, 'utf8');

        const duration = Date.now() - startTime;
        
        // Emit success metrics
        swarmBus.emit('agent:log', 'Dev_Agent', `Successfully wrote compiled file assets to: /workspace/${projectName}/${filename}`, duration, estCost);
        swarmBus.emit('orchestrator:task_complete', { key: 'fileWritten', value: true });

    } catch (error) {
        const duration = Date.now() - startTime;
        
        // Graceful degradation circuit breaker to prevent disk I/O systemic crashes
        swarmBus.emit('agent:log', 'Dev_Agent', `[GRACEFUL FAILURE]: Disk write compilation transaction execution failed: ${error.message}`, duration, 0.00);
        swarmBus.emit('orchestrator:error', `Dev_Agent exception context: ${error.message}`);
    }
});