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

        swarmBus.on('orchestrator:next', () => {
            this.executeNextStep();
        });

        swarmBus.on('orchestrator:error', (errorMessage) => {
            this.state.isRunning = false;
            swarmBus.emit('agent:log', 'System', `Execution halted due to error: ${errorMessage}`);
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

        const taskPayload = {
            ...nextTask,
            projectName: this.state.currentProject,
            sharedMemory: this.state.sharedMemory
        };

        if (nextTask.agent === 'Browser_Agent') {
            swarmBus.emit('task:browser', taskPayload);
        } else if (nextTask.agent === 'Dev_Agent') {
            swarmBus.emit('task:dev', taskPayload);
        } else if (nextTask.agent === 'SysOps_Agent') {
            swarmBus.emit('task:sysops', taskPayload);
        } else {
            swarmBus.emit('orchestrator:error', `Unknown target agent entity: ${nextTask.agent}`);
        }
    }
}

const orchestratorInstance = new Orchestrator();
export default orchestratorInstance;