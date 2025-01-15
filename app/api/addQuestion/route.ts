import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const newEntry = await request.json();

  const filePath = path.resolve(process.cwd(), 'data/polishTimeQuizDB.json');
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(fileData);

  jsonData.push(newEntry);

  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

  return NextResponse.json({ message: 'Question added successfully' }, { status: 200 });
}