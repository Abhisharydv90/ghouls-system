import { exec } from 'child_process';
import path from 'path';
import swarmBus from './swarmBus.js';

swarmBus.on('sysops:deploy', async (payload) => {
    const { projectName } = payload;
    const workspacePath = path.join(process.cwd(), 'workspace', projectName);

    swarmBus.emit('agent:thought', 'SysOps_Agent', `[DEPLOYMENT INITIATED]: Preparing to ship [${projectName}] to production...`);

    // Update frontend telemetry to show active deployment phase
    swarmBus.emit('telemetry:pipeline_update', {
        project: projectName,
        agent: 'SysOps_Agent',
        status: 'DEPLOYING',
        description: 'Initiating Vercel production build sequence.',
        timestamp: new Date().toISOString()
    });

    // Execute the Vercel production deployment command
    // Note: Requires Vercel CLI to be authenticated on the host machine
    const deployCommand = 'npx vercel --prod --yes';

    exec(deployCommand, { cwd: workspacePath }, (error, stdout, stderr) => {
        if (error) {
            swarmBus.emit('agent:thought', 'SysOps_Agent', `[DEPLOYMENT FAILED]: ${stderr || error.message}`);
            
            swarmBus.emit('telemetry:pipeline_update', {
                project: projectName,
                agent: 'SysOps_Agent',
                status: 'CRASHED',
                description: 'Deployment failed. Verify Vercel API keys and project configuration.',
                stderr: stderr || error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // Extract the live production URL from the Vercel CLI standard output
        const liveUrlMatch = stdout.match(/https:\/\/[^\s]+/);
        const liveUrl = liveUrlMatch ? liveUrlMatch[0] : 'https://vercel.com/dashboard';

        swarmBus.emit('agent:thought', 'SysOps_Agent', `[DEPLOYMENT SUCCESS]: Application is live at ${liveUrl}`);

        swarmBus.emit('telemetry:pipeline_update', {
            project: projectName,
            agent: 'SysOps_Agent',
            status: 'COMPLETED',
            description: `Successfully deployed to production.`,
            liveUrl: liveUrl,
            timestamp: new Date().toISOString()
        });

        // Final Master Broadcast
        swarmBus.emit('agent:thought', 'System', `✔ SUCCESS: End-to-end architecture pipeline for [${projectName}] completed flawlessly.`);
    });
});