import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, email, company, message, preferred_date, preferred_time } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (!['meeting', 'contact'].includes(type)) {
      return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 });
    }
    if (type === 'meeting' && !message?.trim()) {
      return NextResponse.json({ error: 'Message is required for meeting requests' }, { status: 400 });
    }
    if (type === 'contact' && !message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('contact_submissions').insert({
      type,
      name: name.trim(),
      email: email.trim(),
      company: company?.trim() || null,
      message: message?.trim() || null,
      preferred_date: preferred_date || null,
      preferred_time: preferred_time || null,
    });

    if (error) {
      console.error('[contact]', error.message);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
