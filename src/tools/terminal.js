import { exec } from 'child_process';
import swarmBus from '../swarmBus.js';

const terminal = {
    /**
     * Executes arbitrary system commands natively on the host platform
     * @param {string} command - Raw terminal command string
     * @returns {Promise<string>} - Standard output response
     */
    execute: (command) => {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    swarmBus.emit('system:error', new Error(`Terminal Execution Failure: ${error.message}`));
                    reject(stderr || error.message);
                    return;
                }
                resolve(stdout);
            });
        });
    }
};

export default terminal;