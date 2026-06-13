import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This acts as our local database file
const dbPath = path.join(process.cwd(), 'ghouls_database.json');

// GET: Fetches the chat history when the page loads
export async function GET() {
    try {
        if (!fs.existsSync(dbPath)) {
            return NextResponse.json({ messages: [] });
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return NextResponse.json({ messages: JSON.parse(data) });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read memory' }, { status: 500 });
    }
}

// POST: Saves the chat history every time a new message is sent
export async function POST(req) {
    try {
        const { messages } = await req.json();
        fs.writeFileSync(dbPath, JSON.stringify(messages, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to write memory' }, { status: 500 });
    }
}