import { exec } from 'child_process';
import path from 'path';
import swarmBus from './swarmBus.js';

swarmBus.on('executor:run_script', ({ projectName, fileName }) => {
    swarmBus.emit('agent:thought', 'Executor_Agent', `Spinning up isolated sandbox for [${fileName}]...`);

    const filePath = path.join(process.cwd(), 'workspace', projectName, fileName);
    
    // Determine the runtime based on the file extension
    let command = '';
    if (fileName.endsWith('.js')) {
        command = `node ${filePath}`;
    } else if (fileName.endsWith('.py')) {
        command = `python3 ${filePath}`;
    } else {
        swarmBus.emit('agent:log', 'Executor_Agent', `[WARNING]: Unrecognized runtime environment for ${fileName}. Aborting execution.`);
        return;
    }

    const startTime = Date.now();

    // Execute the code with a 10-second killswitch so infinite loops don't crash your server
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;

        if (error || stderr) {
            const errorTrace = stderr || error.message;
            swarmBus.emit('agent:log', 'Executor_Agent', `[FATAL EXCEPTION]: Execution crashed. Grabbing stack trace...`, duration);
            
            // The Magic Loop: Send the error back to the Orchestrator to force a rewrite
            swarmBus.emit('orchestrator:repair_loop', { 
                projectName, 
                fileName, 
                errorLog: errorTrace 
            });
        } else {
            swarmBus.emit('agent:log', 'Executor_Agent', `[EXECUTION SUCCESS]: Sandbox output:\n${stdout}`, duration);
            swarmBus.emit('orchestrator:step_complete');
        }
    });
});