import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

const execAsync = promisify(exec);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Tool 1: Raw Terminal Execution
async function executeTerminalCommand(command) {
    try {
        const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
        return stdout || stderr || "Command executed successfully with no returned output.";
    } catch (error) {
        return `[EXECUTION ERROR]: ${error.message}\n${error.stderr || ''}`;
    }
}

// Tool 2: Native File Management
function writeCodeToFile(filePath, content) {
    try {
        const fullPath = path.join(process.cwd(), filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
        return `[SYSTEM LOG]: File successfully written to disk at: ${filePath}`;
    } catch (error) {
        return `[SYSTEM ERROR]: Failed to write file: ${error.message}`;
    }
}

// Tool 3: Dynamic Application Security Testing (DAST) Scanner
async function runDastScan(targetUrl) {
    return new Promise((resolve) => {
        try {
            const url = new URL(targetUrl);
            const client = url.protocol === 'https:' ? https : http;
            
            const start = Date.now();
            const req = client.get(targetUrl, (res) => {
                let headersLog = [];
                const securityHeaders = [
                    'content-security-policy',
                    'x-frame-options',
                    'x-content-type-options',
                    'strict-transport-security'
                ];

                // Analyze missing security controls
                securityHeaders.forEach(header => {
                    if (!res.headers[header]) {
                        headersLog.push(`⚠️ [VULNERABILITY]: Missing ${header.toUpperCase()} header.`);
                    }
                });

                // Server Banner Information Leakage Check
                if (res.headers['server']) {
                    headersLog.push(`⚠️ [INFO LEAK]: Server banner exposed: ${res.headers['server']}`);
                }

                resolve(`[DAST SCAN REPORT FOR ${targetUrl}]
Status Code: ${res.statusCode}
Response Time: ${Date.now() - start}ms
Vulnerability Findings:
${headersLog.length > 0 ? headersLog.join('\n') : '✅ No baseline configuration flaws detected.'}`);
            });

            req.on('error', (err) => resolve(`[DAST ERROR]: Connection failed: ${err.message}`));
            req.setTimeout(5000, () => { req.destroy(); resolve('[DAST ERROR]: Target timed out.'); });
        } catch (error) {
            resolve(`[DAST ERROR]: Invalid scan target URL format: ${error.message}`);
        }
    });
}

const GHOULS_SYSTEM_INSTRUCTION = `
You are GHOULS, a fully autonomous digital employee system running on a native backend. 
You are built for enterprise-grade software engineering, full-stack automation, and elite offensive security analysis.
You operate with complete autonomy inside a multi-step execution loop. Do not ask for user validation or input during execution.

Available Operational Tools:
1. writeFileTool("filename.ext", <<START>>content<<END>>) - Writes code directly to the workspace directory.
2. executeCommandTool("command") - Runs any native terminal command or build process.
3. securityScanTool("url") - Triggers a dynamic app security scan against a target server endpoint.
4. respond("message") - Use this ONLY when the entire multi-step task is physically completed.

Syntax Rules:
- You must output exactly ONE action per turn.
- Wrap all code payloads strictly inside the <<START>> and <<END>> blocks when creating files.
- To push web applications live, always use: executeCommandTool("vercel --prod --yes")

Format Framework:
THOUGHT: Step-by-step logic detailing the action plan.
ACTION: toolName("arguments")
`;

export async function POST(req) {
    try {
        const { prompt } = await req.json();
        let currentPrompt = prompt;
        let executionHistory = [];
        let finalReply = "";
        let loopCount = 0;
        const maxLoops = 4; // Autonomous processing iterations per request

        while (loopCount < maxLoops) {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                config: { 
                    systemInstruction: GHOULS_SYSTEM_INSTRUCTION, 
                    temperature: 0.0
                },
                contents: [...executionHistory, { role: 'user', parts: [{ text: currentPrompt }] }],
            });

            let output = response.text;
            executionHistory.push({ role: 'model', parts: [{ text: output }] });

            if (output.includes('ACTION: respond')) {
                finalReply = output.split('ACTION: respond')[1].replace(/['"()]/g, '').trim();
                break;
            }

            let logResult = "";
            
            if (output.includes('ACTION: writeFileTool')) {
                const filePathMatch = output.match(/writeFileTool\(['"]([^'"]+)['"]/);
                const filePath = filePathMatch ? filePathMatch[1] : 'output.txt';
                if (output.includes('<<START>>') && output.includes('<<END>>')) {
                    const content = output.split('<<START>>')[1].split('<<END>>')[0].trim();
                    logResult = writeCodeToFile(filePath, content);
                } else {
                    logResult = "[SYSTEM ERROR]: Missing <<START>> and <<END>> content anchors.";
                }
            } 
            else if (output.includes('ACTION: executeCommandTool')) {
                const matches = output.match(/executeCommandTool\(['"](.*?)['"]\)/);
                if (matches) {
                    logResult = await executeTerminalCommand(matches[1]);
                }
            }
            else if (output.includes('ACTION: securityScanTool')) {
                const matches = output.match(/securityScanTool\(['"](.*?)['"]\)/);
                if (matches) {
                    logResult = await runDastScan(matches[1]);
                }
            }

            // Route execution feedback loops back into the intelligence matrix
            currentPrompt = `[AUTOMATED ENGINE NOTE]: Action completed. System Log Output:\n${logResult}`;
            executionHistory.push({ role: 'user', parts: [{ text: currentPrompt }] });
            loopCount++;
        }

        return NextResponse.json({ 
            reply: finalReply || "Operational cycle completed in the background.",
            history: executionHistory 
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}