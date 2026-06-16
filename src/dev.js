import fs from 'fs';
import path from 'path';
import swarmBus from './swarmBus.js';

swarmBus.on('task:dev', async (payload) => {
    const startTime = Date.now();
    
    const projectName = payload.projectName || 'default_project';
    const filename = payload.filename || 'output.js'; // Default to code files
    
    // Accept raw code output directly from the Orchestrator or fallback to shared memory
    const fileContent = payload.content || payload.sharedMemory?.scrapedData || payload.codeOutput || '// No content provided';

    swarmBus.emit('agent:thought', 'System_IO', `Executing disk write sequence for: [${projectName}/${filename}]`);

    try {
        const workspaceRoot = path.join(process.cwd(), 'workspace');
        const targetFilePath = path.join(workspaceRoot, projectName, filename);
        
        // Extract the exact directory path from the filename (e.g., 'src/app/api/route.js' -> 'src/app/api')
        const targetDirectory = path.dirname(targetFilePath);

        // CREATE NESTED DIRECTORIES AUTONOMOUSLY: 
        // recursive: true ensures it builds the whole tree without crashing
        if (!fs.existsSync(targetDirectory)) {
            fs.mkdirSync(targetDirectory, { recursive: true });
        }

        // Write the pure code with zero ASCII headers or legacy corruption
        fs.writeFileSync(targetFilePath, fileContent, 'utf8');

        const durationMs = Date.now() - startTime;
        
        // Emit clean success metrics
        swarmBus.emit('agent:log', 'System_IO', `[DISK COMPILE SUCCESS]: Saved cleanly to /workspace/${projectName}/${filename}`, durationMs, 0.0001);
        swarmBus.emit('orchestrator:task_complete', { key: 'fileWritten', value: true, path: targetFilePath });

    } catch (error) {
        const durationMs = Date.now() - startTime;
        
        swarmBus.emit('agent:log', 'System_IO', `[I/O FATAL ERROR]: Disk write transaction failed for ${filename}: ${error.message}`, durationMs, 0.00);
        swarmBus.emit('orchestrator:error', `System_IO exception context: ${error.message}`);
    }
});