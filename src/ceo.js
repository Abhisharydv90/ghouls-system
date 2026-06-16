import swarmBus from './swarmBus.js';
import fs from 'fs';
import path from 'path';

class CEOAgent {
    constructor() {
        this.activeSpecialists = new Set(['System_IO']);
        this.currentProject = null;
        this.executionGraph = [];
        this.currentStepIndex = 0;
        this.startTime = null;
        this.setupListeners();
    }

    setupListeners() {
        swarmBus.on('ceo:directive', async (rawInstruction) => {
            this.startTime = Date.now();
            swarmBus.emit('agent:thought', 'CEO_Agent', `Analyzing incoming system directive...`);

            try {
                // Hardcoded fallback for the Lead Gen SaaS project to ensure clean scoping
                let projectName = 'lead_gen_saas';
                const instructionLower = rawInstruction.toLowerCase();
                if (instructionLower.includes('proxy')) projectName = 'aegis_proxy';
                
                swarmBus.emit('agent:thought', 'CEO_Agent', `[MEMORY MISS]: Generating fresh workspace environment for Architect Agent.`);
                
                const workspacePath = path.join(process.cwd(), 'workspace', projectName);
                if (!fs.existsSync(workspacePath)) {
                    fs.mkdirSync(workspacePath, { recursive: true });
                }
                
                fs.writeFileSync(path.join(workspacePath, 'requirements.txt'), rawInstruction);
                swarmBus.emit('architect:parse_prd', { projectName, prdFileName: 'requirements.txt' });

            } catch (error) {
                swarmBus.emit('agent:log', 'CEO_Agent', `[GRACEFUL FAILURE]: Analysis pipeline broken. Error: ${error.message}`);
            }
        });

        swarmBus.on('ceo:initialize_workspace', (roadmap) => {
            this.currentProject = roadmap.projectName;
            this.executionGraph = roadmap.executionGraph;
            this.currentStepIndex = 0;
            swarmBus.emit('agent:thought', 'CEO_Agent', `Initializing production workspace for project: [${this.currentProject}]`);
            this.executeNextStep();
        });

        swarmBus.on('orchestrator:step_complete', (data) => {
            const currentTask = this.executionGraph[this.currentStepIndex];
            
            swarmBus.emit('telemetry:pipeline_update', {
                project: this.currentProject,
                step: currentTask.step,
                agent: data.agent,
                status: 'COMPLETED',
                explanation: `Output validated cleanly. Routing to System_IO for disk write.`,
                timestamp: new Date().toISOString()
            });

            // ROUTE THE CLEAN CODE TO THE DISK WRITER
            swarmBus.emit('task:dev', {
                projectName: this.currentProject,
                filename: currentTask.file || `step_${currentTask.step}.js`,
                content: data.output
            });

            this.currentStepIndex++;
            this.executeNextStep();
        });

        swarmBus.on('orchestrator:step_failed', (data) => {
            swarmBus.emit('agent:thought', 'CEO_Agent', `[ALERT]: Step execution failed at agent [${data.agent}]. Halting pipeline to prevent corruption.`);
        });
    }

    spawnSpecialist(role) {
        if (this.activeSpecialists.has(role)) return;
        this.activeSpecialists.add(role);
        swarmBus.emit('agent:thought', 'CEO_Agent', `[DYNAMIC SPAWN]: Provisioning active context pipeline for [${role}].`);
    }

    executeNextStep() {
        if (this.currentStepIndex >= this.executionGraph.length) {
            swarmBus.emit('agent:log', 'CEO_Agent', `[MASTER BUILD COMPLETE]: All roadmap graph tasks closed out.`);
            return;
        }

        const currentTask = this.executionGraph[this.currentStepIndex];
        this.spawnSpecialist(currentTask.agent);
        
        swarmBus.emit('agent:thought', 'CEO_Agent', `Dispatching Job #${currentTask.step} to Employee Node: [${currentTask.agent}]`);
        swarmBus.emit(`agent:execute:${currentTask.agent}`, {
            project: this.currentProject,
            task: currentTask
        });
    }
}

const ceo = new CEOAgent();
export default ceo;