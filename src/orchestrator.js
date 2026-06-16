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
        // ONLY triggers for legacy V5.0 workflows. The CEO now handles V6.0 logic.
        swarmBus.on('orchestrator:init_plan', (payload) => {
            this.state.currentProject = payload.projectName || 'unnamed_project';
            this.state.plan = payload.steps || [];
            this.state.currentStep = 0;
            this.state.sharedMemory = {};
            this.state.isRunning = true;
            swarmBus.emit('agent:thought', 'Orchestrator', `[LEGACY PIPELINE] State initialized.`);
            this.executeNextStep();
        });

        swarmBus.on('orchestrator:task_complete', (data) => {
            if (data && data.key) {
                this.state.sharedMemory[data.key] = data.value;
            }
            // Do not advance the CEO's pipeline, only advance the legacy state
            if (this.state.isRunning) {
                this.state.currentStep++;
                this.executeNextStep();
            }
        });

        swarmBus.on('orchestrator:error', (errorMessage) => {
            this.state.isRunning = false;
            swarmBus.emit('agent:log', 'System', `Execution halted due to error: ${errorMessage}`);
        });
    }

    executeNextStep() {
        if (this.state.currentStep >= this.state.plan.length || !this.state.isRunning) {
            this.state.isRunning = false;
            return;
        }

        const nextTask = this.state.plan[this.state.currentStep];
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
        } else if (nextTask.agent === 'SysOps_Agent') {
            swarmBus.emit('task:sysops', taskPayload);
        } else if (nextTask.agent === 'Executor_Agent') {
            swarmBus.emit('executor:run_script', taskPayload);
        } else if (nextTask.agent === 'QA_Agent') {
            swarmBus.emit('qa:review_build', taskPayload);
        }
    }
}

const orchestratorInstance = new Orchestrator();
export default orchestratorInstance;