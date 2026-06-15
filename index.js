import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import schedule from 'node-schedule';

// Load system runtime components (The Brains)
import swarmBus from './src/swarmBus.js';
import './src/orchestrator.js';
import './src/memory.js';
import './src/qa.js';
import './src/ceo.js';
import './src/browser.js';
import './src/dev.js';
import './src/sysops.js';
import './src/executor.js';
// --- NEW V6.0 MODULES IMPORTED ---
import './src/architect.js';
import './src/visionQa.js';
import './src/worker.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- HISTORY LOGGING SYSTEM (HARDENED WITH METRICS) ---
const historyFile = path.join(process.cwd(), 'ghouls_history.json');
if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, JSON.stringify([]));
}

function writeToHistory(type, agent, message, durationMs = null, estCost = null, extraData = null) {
    try {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        const newEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: type,
            agent: agent,
            message: message,
            metrics: durationMs ? { latency: `${durationMs}ms`, cost: `$${estCost}` } : null,
            ...extraData // Append telemetry data like stdout/stderr or liveUrls
        };
        history.unshift(newEntry);
        if (history.length > 500) history.pop();
        fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error(`[SYS ERROR]: Failed to write to history log:`, error);
    }
}

// --- SWARMBUS LISTENERS (PIPING TO WEBSOCKETS) ---
swarmBus.on('agent:thought', (agent, message, duration = null, cost = null) => {
    io.emit('agent:thought', { agent, message });
    writeToHistory('thought', agent, message, duration, cost);
});

swarmBus.on('agent:log', (agent, message, duration = null, cost = null) => {
    io.emit('agent:log', { agent, message });
    writeToHistory('log', agent, message, duration, cost);
});

// --- NEW: TELEMETRY STREAMING FOR FRONTEND UI ---
swarmBus.on('telemetry:pipeline_update', (data) => {
    io.emit('telemetry:pipeline_update', data);
    writeToHistory('telemetry', data.agent, data.description || `Pipeline status: ${data.status}`, null, null, data);
});

swarmBus.on('telemetry:node_spawned', (data) => {
    io.emit('telemetry:node_spawned', data);
    writeToHistory('telemetry', data.agent, `Node provisioned: ${data.agent}`, null, null, data);
});

swarmBus.on('gateway:request_ui', (task) => {
    io.emit('agent:log', 'System', `[CRITICAL ALERT]: Task halted by security gateway. Awaiting authorization.`);
    writeToHistory('system', 'Gateway', 'Security override requested.');
});

// --- AUTOMATION SCHEDULER ---
const activeJobs = [];

function createRoutine(name, cronExpression, command) {
    const job = schedule.scheduleJob(cronExpression, () => {
        const startTime = Date.now();
        console.log(`[ROUTINE TRIGGERED]: ${name}`);
        swarmBus.emit('ceo:directive', command);
        writeToHistory('system', 'Routine', `Triggered: ${name} | Command: ${command}`, Date.now() - startTime, 0.001);
    });
    activeJobs.push({ name, cron: cronExpression, command, job });
}

// --- WEBSOCKET CONNECTION & ROUTING ---
io.on('connection', (socket) => {
    console.log(`[NEURAL BRIDGE]: Client connection mapped: ${socket.id}`);

    socket.on('command:execute', (data) => {
        swarmBus.emit('ceo:directive', data.command);
        writeToHistory('system', 'User', `Directive issued: ${data.command}`);
    });

    socket.on('command:authorize', (data) => {
        if (data.auth === 'yes') {
            swarmBus.emit('gateway:approve');
            writeToHistory('system', 'User', 'Action payload authorized.');
        } else {
            swarmBus.emit('gateway:deny');
            writeToHistory('system', 'User', 'Action payload rejected.');
        }
    });

    socket.on('workspace:fetch', () => {
        const workspaceDir = path.join(process.cwd(), 'workspace');
        if (!fs.existsSync(workspaceDir)) fs.mkdirSync(workspaceDir);
        try {
            const projectFolders = fs.readdirSync(workspaceDir).filter(file => 
                fs.statSync(path.join(workspaceDir, file)).isDirectory()
            );
            socket.emit('workspace:list', projectFolders.map(folder => ({
                name: folder, status: 'STANDBY', path: `/workspace/${folder}`
            })));
        } catch (error) {
            console.error("[SYS ERROR]: Failed to build workspace list:", error);
        }
    });

    socket.on('workspace:read_project', (projectName) => {
        const projectDir = path.join(process.cwd(), 'workspace', projectName);
        if (fs.existsSync(projectDir)) {
            try {
                const files = fs.readdirSync(projectDir);
                const fileData = files.map(file => {
                    const filePath = path.join(projectDir, file);
                    if (fs.statSync(filePath).isFile()) {
                        return { name: file, content: fs.readFileSync(filePath, 'utf8') };
                    }
                    return null;
                }).filter(f => f !== null);
                socket.emit('workspace:project_data', { projectName, files: fileData });
            } catch (error) {
                console.error("[SYS ERROR]: Failed to read file structures:", error);
            }
        }
    });

    socket.on('history:fetch', () => {
        try {
            const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
            socket.emit('history:data', history);
        } catch (error) {
            socket.emit('history:data', []);
        }
    });

    socket.on('routine:add', (data) => {
        createRoutine(data.name, data.cron, data.command);
        socket.emit('routine:list', activeJobs.map(j => ({ name: j.name, cron: j.cron })));
    });

    socket.on('routine:fetch', () => {
        socket.emit('routine:list', activeJobs.map(j => ({ name: j.name, cron: j.cron })));
    });

    socket.on('disconnect', () => {
        console.log(`[NEURAL BRIDGE]: Client session terminated: ${socket.id}`);
    });
});

// --- ENVIRONMENT AND PORT CONFIGURATION FOR DEPLOYMENT ---
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`       GHOULS OS ENGINE v6.0.0 - LIVE RUNTIME     `);
    console.log(`==================================================`);
    console.log(`[SYS]: Core heartbeat initialized. Engine bound to Port ${PORT}`);
});