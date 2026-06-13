import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'ghouls_database.json');

export const memoryLedger = {
    // Reads the database, creates it if it doesn't exist
    read: () => {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify({ system_memory: [] }, null, 2));
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    },
    
    // Saves a summary of the completed task to the database
    save: (directive, plan) => {
        const db = memoryLedger.read();
        db.system_memory.push({
            timestamp: new Date().toLocaleString(),
            user_directive: directive,
            actions_completed: plan.map(step => step.thought)
        });
        
        // Keep the memory from overflowing the context window (keeps last 10 tasks)
        if (db.system_memory.length > 10) db.system_memory.shift();
        
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }
};