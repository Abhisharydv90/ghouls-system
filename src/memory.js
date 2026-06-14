import fs from 'fs';
import path from 'path';
import swarmBus from './swarmBus.js';

const memoryDBPath = path.join(process.cwd(), 'ghouls_vector_memory.json');

// Initialize the memory bank if it doesn't exist
if (!fs.existsSync(memoryDBPath)) {
    fs.writeFileSync(memoryDBPath, JSON.stringify({}));
}

swarmBus.on('memory:store_solution', ({ projectName, fileName, code }) => {
    try {
        const memoryBank = JSON.parse(fs.readFileSync(memoryDBPath, 'utf8'));
        
        // Store the verified code snippet with a timestamp
        memoryBank[`${projectName}_${fileName}`] = {
            timestamp: new Date().toISOString(),
            verified_code: code
        };

        fs.writeFileSync(memoryDBPath, JSON.stringify(memoryBank, null, 2));
        swarmBus.emit('agent:thought', 'Memory_Agent', `Architectural pattern for [${fileName}] committed to long-term memory.`);
    } catch (error) {
        console.error(`[SYS ERROR]: Failed to write to memory bank:`, error);
    }
});

swarmBus.on('memory:retrieve', (queryKey) => {
    try {
        const memoryBank = JSON.parse(fs.readFileSync(memoryDBPath, 'utf8'));
        if (memoryBank[queryKey]) {
            swarmBus.emit('agent:thought', 'Memory_Agent', `Historic solution found for [${queryKey}]. Injecting into current context.`);
            // Send the historic code back to the Orchestrator or Dev Agent
            swarmBus.emit('memory:retrieved_data', memoryBank[queryKey].verified_code);
        } else {
            swarmBus.emit('agent:thought', 'Memory_Agent', `No historic vectors matched. Swarm must generate from scratch.`);
        }
    } catch (error) {
        console.error(`[SYS ERROR]: Failed to read memory bank:`, error);
    }
});