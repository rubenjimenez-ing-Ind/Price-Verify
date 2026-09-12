import { NextRequest, NextResponse } from 'next/server';
import { create, getAll, getById, remove, update } from '@/lib/json-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string } },
) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const record = await getById(params.collection, id);
      if (!record) {
        return NextResponse.json({ success: false, error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: record, timestamp: new Date().toISOString() }, { status: 200 });
    }

    const records = await getAll(params.collection);
    return NextResponse.json({ success: true, data: records, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { collection: string } },
) {
  try {
    const body = await request.json();
    const created = await create(params.collection, body);

    return NextResponse.json(
      { success: true, data: created, timestamp: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Unable to create item', code: 'CREATE_ERROR' }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { collection: string } },
) {
  try {
    const body = await request.json();
    const { id, ...partial } = body;
    const updated = await update(params.collection, id, partial);

    return NextResponse.json({ success: true, data: updated, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Unable to update item', code: 'UPDATE_ERROR' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { collection: string } },
) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id', code: 'MISSING_ID' }, { status: 400 });
  }

  try {
    await remove(params.collection, id);
    return NextResponse.json({ success: true, data: { deleted: true }, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Unable to delete item', code: 'DELETE_ERROR' }, { status: 404 });
  }
}
