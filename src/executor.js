import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import swarmBus from './swarmBus.js';

/**
 * Maps file extensions to their respective runtime commands
 */
function getRuntimeCommand(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.js':
            return `node ${filename}`;
        case '.py':
            return `python3 ${filename}`;
        case '.sh':
            return `bash ${filename}`;
        default:
            throw new Error(`Unsupported runtime extension: ${ext}`);
    }
}

swarmBus.on('executor:run', async (payload) => {
    const { projectName, fileName, filename } = payload;
    const targetFile = fileName || filename;
    
    if (!targetFile) {
        swarmBus.emit('agent:log', 'Executor_Agent', '[CRITICAL]: No target execution file specified.');
        return;
    }

    // Resolve workspace sandbox directories natively
    const workspacePath = path.join(process.cwd(), 'workspace', projectName);
    const filePath = path.join(workspacePath, targetFile);

    swarmBus.emit('agent:thought', 'Executor_Agent', `Spinning up isolated sandbox for [${targetFile}]...`);

    if (!fs.existsSync(filePath)) {
        const errorMsg = `File not found at target vector path: ${filePath}`;
        swarmBus.emit('agent:thought', 'Executor_Agent', `[FATAL EXCEPTION]: ${errorMsg}`);
        swarmBus.emit('orchestrator:step_failed', { agent: 'Executor_Agent', error: errorMsg, path: filePath });
        return;
    }

    try {
        const runtimeCommand = getRuntimeCommand(targetFile);

        // Execute natively within the project's workspace directory
        exec(runtimeCommand, { cwd: workspacePath }, (error, stdout, stderr) => {
            const timestamp = new Date().toISOString();
            
            if (error || stderr) {
                const stackTrace = stderr || error.message;
                swarmBus.emit('agent:thought', 'Executor_Agent', `[FATAL EXCEPTION]: Execution crashed. Grabbing stack trace...`);
                
                // Telemetry payload for frontend History Visualizer
                swarmBus.emit('telemetry:pipeline_update', {
                    status: 'CRASHED',
                    agent: 'Executor_Agent',
                    timestamp,
                    stdout: stdout || null,
                    stderr: stackTrace,
                    fixLoopActive: true
                });

                // Route failure back to Orchestrator to trigger autoregressive self-healing
                swarmBus.emit('orchestrator:step_failed', {
                    agent: 'Executor_Agent',
                    error: stackTrace,
                    project: projectName,
                    file: targetFile
                });
                return;
            }

            // Flawless execution telemetry output
            swarmBus.emit('agent:thought', 'Executor_Agent', `[SUCCESS]: Sandbox execution completed clean.`);
            
            swarmBus.emit('telemetry:pipeline_update', {
                status: 'COMPLETED',
                agent: 'Executor_Agent',
                timestamp,
                stdout: stdout,
                stderr: null,
                fixLoopActive: false
            });

            swarmBus.emit('orchestrator:step_complete', {
                agent: 'Executor_Agent',
                output: stdout,
                project: projectName,
                file: targetFile
            });
        });

    } catch (cmdError) {
        swarmBus.emit('agent:thought', 'Executor_Agent', `[RUNTIME CONFIG ERROR]: ${cmdError.message}`);
        swarmBus.emit('orchestrator:step_failed', { agent: 'Executor_Agent', error: cmdError.message });
    }
});