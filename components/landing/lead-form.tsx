'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Calendar, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FormType = 'meeting' | 'contact';

interface LeadFormProps {
  type: FormType;
  compact?: boolean;
}

export function LeadForm({ type, compact = false }: LeadFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMeeting = type === 'meeting';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (isMeeting && !message.trim()) {
      setError('Please tell us what you want to discuss.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || null,
          message: message.trim() || null,
          preferred_date: preferredDate || null,
          preferred_time: preferredTime || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSuccess(true);
      setName('');
      setEmail('');
      setCompany('');
      setMessage('');
      setPreferredDate('');
      setPreferredTime('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={`rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 ${compact ? '' : 'p-8'}`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-medium text-foreground">
              {isMeeting ? 'Meeting request sent!' : 'Message sent!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isMeeting
                ? "We'll confirm your meeting time by email within 1 business day."
                : "Thanks for reaching out. We'll get back to you soon."}
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="text-sm text-foreground/70 hover:text-foreground mt-3 underline underline-offset-4"
            >
              Send another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${compact ? 'max-w-lg' : 'max-w-xl'}`}>
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className={compact ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div className={compact ? '' : 'sm:col-span-1'}>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Your name"
            className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
      </div>

      {isMeeting && (
        <>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Optional"
              className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Preferred date</label>
              <input
                type="date"
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Preferred time</label>
              <select
                value={preferredTime}
                onChange={e => setPreferredTime(e.target.value)}
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
              >
                <option value="">Select a time</option>
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
              </select>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {isMeeting ? 'What would you like to discuss? *' : 'Message *'}
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required={!isMeeting}
          rows={compact ? 3 : 4}
          placeholder={isMeeting ? 'Briefly describe your project or question…' : 'How can we help?'}
          className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 resize-none transition-colors"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        size={compact ? 'default' : 'lg'}
        className={`rounded-full ${compact ? '' : 'h-12 px-8'} bg-foreground hover:bg-foreground/90 text-background`}
      >
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isMeeting ? (
          <>
            <Calendar size={16} className="mr-2" />
            Request free meeting
          </>
        ) : (
          <>
            <Send size={16} className="mr-2" />
            Send message
          </>
        )}
      </Button>
    </form>
  );
}
