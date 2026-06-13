import fs from 'fs';
import path from 'path';
import swarmBus from '../swarmBus.js';

const fileSystem = {
    /**
     * Reads contents from a local path
     */
    readFile: (filePath) => {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            swarmBus.emit('system:error', new Error(`File Read Failure at ${filePath}: ${error.message}`));
            throw error;
        }
    },

    /**
     * Writes or overwrites structural file code directly
     */
    writeFile: (filePath, data) => {
        try {
            const directory = path.dirname(filePath);
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            fs.writeFileSync(filePath, data, 'utf8');
            return true;
        } catch (error) {
            swarmBus.emit('system:error', new Error(`File Write Failure at ${filePath}: ${error.message}`));
            throw error;
        }
    },

    /**
     * Appends unstructured tracking items to persistent documents
     */
    appendFile: (filePath, data) => {
        try {
            fs.appendFileSync(filePath, data, 'utf8');
            return true;
        } catch (error) {
            swarmBus.emit('system:error', new Error(`File Append Failure at ${filePath}: ${error.message}`));
            throw error;
        }
    }
};

export default fileSystem;