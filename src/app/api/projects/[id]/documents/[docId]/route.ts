// DELETE /api/projects/[id]/documents/[docId] — remove a document.
import { NextRequest, NextResponse } from 'next/server';
import { logAction, requireSession } from '@/lib/auth-server';
import { getDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string; docId: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const idx = db.documents.findIndex((d) => d.id === params.docId && d.project_id === params.id);
    if (idx === -1) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const [removed] = db.documents.splice(idx, 1);
    logAction(session.email, 'delete_document', 'documents', removed.id, {
      file_name: removed.file_name,
      project_id: removed.project_id,
    });
    return NextResponse.json({ status: 'deleted' });
  } catch (err) {
    console.error('DELETE /api/projects/[id]/documents/[docId] failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
