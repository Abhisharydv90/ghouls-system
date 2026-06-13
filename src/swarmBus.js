import { EventEmitter } from 'events';

class SwarmBus extends EventEmitter {
    constructor() {
        super();
        // Increase listener limits for multi-agent scaling to prevent memory leak warnings
        this.setMaxListeners(100);
    }
}

const swarmBus = new SwarmBus();
export default swarmBus;