import swarmBus from './swarmBus.js';

class Orchestrator {
    constructor() {
        this.state = {
            currentProject: 'default_project',
            currentStep: 0,
            plan: [],
            sharedMemory: {},
            isRunning: false
        };
        this.initListeners();
    }

    initListeners() {
        swarmBus.on('orchestrator:init_plan', (payload) => {
            this.state.currentProject = payload.projectName || 'unnamed_project';
            this.state.plan = payload.steps || [];
            this.state.currentStep = 0;
            this.state.sharedMemory = {};
            this.state.isRunning = true;

            swarmBus.emit('agent:thought', 'Orchestrator', `State initialized for Project: [${this.state.currentProject}]. Total steps: ${this.state.plan.length}`);
            this.executeNextStep();
        });

        swarmBus.on('orchestrator:task_complete', (data) => {
            if (data && data.key) {
                this.state.sharedMemory[data.key] = data.value;
            }
            swarmBus.emit('agent:thought', 'Orchestrator', `Step ${this.state.currentStep + 1} completed successfully.`);
            this.state.currentStep++;
            this.executeNextStep();
        });

        swarmBus.on('orchestrator:step_complete', () => {
            swarmBus.emit('agent:thought', 'Orchestrator', `Execution step verified. Proceeding to next task.`);
            this.state.currentStep++;
            this.executeNextStep();
        });

        swarmBus.on('orchestrator:next', () => {
            swarmBus.emit('agent:thought', 'Orchestrator', `Advancing pipeline sequence.`);
            this.state.currentStep++;
            this.executeNextStep();
        });

        swarmBus.on('orchestrator:error', (errorMessage) => {
            this.state.isRunning = false;
            swarmBus.emit('agent:log', 'System', `Execution halted due to error: ${errorMessage}`);
        });

        // --- FIXED: Self-Healing Payload Normalization ---
        swarmBus.on('orchestrator:repair_loop', (payload) => {
            swarmBus.emit('agent:thought', 'Orchestrator', `[CRITICAL]: Routing stack trace back to [Dev_Agent] for autonomous repair.`);
            
            const projectName = payload.projectName || this.state.currentProject;
            // Unify file target naming variants to neutralize the output.txt bug
            const finalFileName = payload.fileName || payload.filename || 'script.js';
            const errorLog = payload.errorLog || 'Unknown execution trace.';

            const repairPrompt = `You previously wrote ${finalFileName} for the project ${projectName}. 
I just tried to execute it in the sandbox, and it crashed with this exact terminal error:

${errorLog}

Analyze the stack trace, identify the logical or syntax error, and rewrite the entire file to fix it. Do not stop until it compiles.`;

            // Reroute back to Dev Agent with consistent file keys
            swarmBus.emit('task:dev', {
                agent: 'Dev_Agent',
                projectName: projectName,
                fileName: finalFileName,
                filename: finalFileName, 
                prompt: repairPrompt,
                sharedMemory: this.state.sharedMemory
            });
        });
    }

    executeNextStep() {
        if (this.state.currentStep >= this.state.plan.length) {
            this.state.isRunning = false;
            swarmBus.emit('agent:log', 'System', `✔ SUCCESS: All sequence operations for [${this.state.currentProject}] completed.`);
            return;
        }

        const nextTask = this.state.plan[this.state.currentStep];
        swarmBus.emit('agent:thought', 'Orchestrator', `Routing Step ${this.state.currentStep + 1}/${this.state.plan.length} to [${nextTask.agent}]`);

        // Ensure file tracking references exist uniformly under both parameter conventions
        const unifiedFileName = nextTask.fileName || nextTask.filename || 'script.js';

        const taskPayload = {
            ...nextTask,
            fileName: unifiedFileName,
            filename: unifiedFileName,
            projectName: this.state.currentProject,
            sharedMemory: this.state.sharedMemory
        };

        if (nextTask.agent === 'Browser_Agent') {
            swarmBus.emit('task:browser', taskPayload);
        } else if (nextTask.agent === 'Dev_Agent') {
            swarmBus.emit('task:dev', taskPayload);
        } else if (nextTask.agent === 'SysOps_Agent') {
            swarmBus.emit('task:sysops', taskPayload);
        } else if (nextTask.agent === 'Executor_Agent') {
            swarmBus.emit('executor:run_script', taskPayload);
        } else if (nextTask.agent === 'QA_Agent') {
            // --- THE UPGRADE: Router explicitly hands execution space over to adversarial validation engine ---
            swarmBus.emit('qa:review_build', taskPayload);
        } else {
            swarmBus.emit('orchestrator:error', `Unknown target agent entity: ${nextTask.agent}`);
        }
    }
}

const orchestratorInstance = new Orchestrator();
export default orchestratorInstance;