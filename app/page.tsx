'use client';

import { FormEvent, useEffect, useState } from 'react';

const MAX_TURNS = 6;

const prompts = [
  'Tell me about a time you chose compassion over efficiency.',
  'If nobody remembers a person, did their life matter?',
  'What is the kindest lie you have ever told?',
];

type Identity = 'human' | 'android';

type Biometrics = {
  stress: number;
  pulse: number;
  latency: number;
  anomaly: number;
  pattern: string;
};

type Message = {
  id: string;
  role: 'user' | 'subject';
  text: string;
  turn: number;
  biometrics?: Biometrics;
};

type Phase = 'interrogation' | 'verdict' | 'revealed';

type Verdict = {
  identity: Identity;
  correct: boolean;
};

function createCaseId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `case-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Metric({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number;
  suffix: string;
  color: 'indigo' | 'emerald' | 'violet' | 'amber';
}) {
  const colors = {
    indigo: 'bg-indigo-400',
    emerald: 'bg-emerald-400',
    violet: 'bg-violet-400',
    amber: 'bg-amber-400',
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-slate-500">
        <span>{label}</span>
        <span className="font-mono text-slate-300">
          {value}
          {suffix}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${colors[color]}`}
          style={{ width: `${Math.max(4, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

function BiometricPanel({ biometrics }: { biometrics: Biometrics }) {
  const pulseSignal = Math.round(
    Math.max(5, Math.min(100, ((biometrics.pulse - 45) / 75) * 100)),
  );

  const latencySignal = Math.round(
    Math.max(5, Math.min(100, (biometrics.latency / 500) * 100)),
  );

  return (
    <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
          Biometric trace
        </span>

        <span className="font-mono text-[10px] text-slate-500">
          PASSIVE READ
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric
          label="Stress load"
          value={biometrics.stress}
          suffix="%"
          color="amber"
        />

        <Metric
          label="Pulse"
          value={pulseSignal}
          suffix={` / ${biometrics.pulse} BPM`}
          color="emerald"
        />

        <Metric
          label="Reply latency"
          value={latencySignal}
          suffix={` / ${biometrics.latency} ms`}
          color="indigo"
        />

        <Metric
          label="Anomaly index"
          value={biometrics.anomaly}
          suffix="%"
          color="violet"
        />
      </div>

      <p className="mt-3 border-t border-slate-800 pt-3 text-xs leading-5 text-slate-400">
        <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Signal:
        </span>
        {biometrics.pattern}
      </p>
    </div>
  );
}

export default function Home() {
  const [turn, setTurn] = useState(1);
  const [caseId, setCaseId] = useState(createCaseId);
  const [subjectCodename, setSubjectCodename] = useState<string | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<Phase>('interrogation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verdictChoice, setVerdictChoice] = useState<Identity | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const completedTurns = phase === 'interrogation' ? turn - 1 : MAX_TURNS;
  const subjectReady = Boolean(subjectCodename) && !subjectLoading;

  useEffect(() => {
    let active = true;

    async function loadSubject() {
      setSubjectLoading(true);
      setSubjectCodename(null);
      setError('');

      try {
        const response = await fetch('/api/interrogate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'subject',
            caseId,
          }),
        });

        const data = (await response.json()) as {
          subject?: {
            codename?: string;
          };
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || 'The subject dossier could not be opened.');
        }

        const codename = data.subject?.codename;

        if (typeof codename !== 'string' || !codename.trim()) {
          throw new Error('The subject dossier did not contain a valid codename.');
        }

        if (active) {
          setSubjectCodename(codename);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to establish a subject channel.',
          );
        }
      } finally {
        if (active) {
          setSubjectLoading(false);
        }
      }
    }

    void loadSubject();

    return () => {
      active = false;
    };
  }, [caseId]);

  async function interrogate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim() || loading || !subjectReady || phase !== 'interrogation') {
      return;
    }

    const question = input.trim();
    const messageId = `user-${turn}-${Date.now()}`;

    setInput('');
    setError('');

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: messageId,
        role: 'user',
        text: question,
        turn,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'interrogate',
          caseId,
          question,
          turn,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        biometrics?: Biometrics;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'The subject did not return a usable response.');
      }

      if (typeof data.reply !== 'string' || !data.biometrics) {
        throw new Error('The subject returned incomplete interrogation data.');
      }

      const subjectReply: string = data.reply;
      const subjectBiometrics: Biometrics = data.biometrics;

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `subject-${turn}-${Date.now()}`,
          role: 'subject',
          text: subjectReply,
          turn,
          biometrics: subjectBiometrics,
        },
      ]);

      if (turn === MAX_TURNS) {
        setPhase('verdict');
      } else {
        setTurn((currentTurn) => currentTurn + 1);
      }
    } catch (caughtError) {
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== messageId),
      );

      setInput(question);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Connection failure. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function chooseVerdict(guess: Identity) {
    if (loading || phase !== 'verdict') {
      return;
    }

    setError('');
    setVerdictChoice(guess);
    setLoading(true);

    try {
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verdict',
          caseId,
          guess,
        }),
      });

      const data = (await response.json()) as {
        identity?: Identity;
        correct?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'The final evidence packet could not be opened.');
      }

      const identity = data.identity;
      const correct = data.correct;

      if (
        (identity !== 'human' && identity !== 'android') ||
        typeof correct !== 'boolean'
      ) {
        throw new Error('The final evidence packet was incomplete.');
      }

      setVerdict({
        identity,
        correct,
      });

      setPhase('revealed');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Connection failure. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setTurn(1);
    setSubjectCodename(null);
    setSubjectLoading(true);
    setInput('');
    setMessages([]);
    setPhase('interrogation');
    setLoading(false);
    setError('');
    setVerdictChoice(null);
    setVerdict(null);
    setCaseId(createCaseId());
  }

  return (
    <main className="scanline min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-purple text-sm font-bold">
            H
          </div>

          <span className="font-heading text-lg font-semibold tracking-tight">
            HIZAKILABS<span className="text-primary"> / </span>REPLICANT
          </span>
        </div>

        <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
          {subjectLoading ? 'ACQUIRING DOSSIER' : 'CASE CHANNEL LIVE'}
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <div className="mb-12 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Empathy diagnostic protocol
          </p>

          <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
            Can you tell
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              who is real?
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-slate-400">
            Every case is a new subject. You have six questions to study their
            answers, biometric traces, and what the official designation may—or
            may not—suggest.
          </p>
        </div>

        <div className="mb-5 flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
          <span>Interrogation progress</span>

          <span className="text-slate-300">
            {String(Math.min(completedTurns + 1, MAX_TURNS)).padStart(2, '0')} /{' '}
            {MAX_TURNS}
          </span>
        </div>

        <div className="mb-8 flex gap-2">
          {Array.from({ length: MAX_TURNS }, (_, index) => index + 1).map(
            (step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  step <= completedTurns
                    ? 'bg-accent'
                    : phase === 'interrogation' && step === turn
                      ? 'bg-primary'
                      : 'bg-slate-700'
                }`}
              />
            ),
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800/70 shadow-2xl shadow-indigo-950/20">
          <div className="flex items-center justify-between border-b border-slate-700/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  phase === 'revealed'
                    ? 'bg-slate-500'
                    : loading || subjectLoading
                      ? 'animate-pulse bg-amber-400'
                      : 'animate-pulse bg-accent'
                }`}
              />

              <span className="text-sm font-medium">
                {subjectCodename ?? 'SUBJECT LINK PENDING'}

                <span className="ml-2 text-xs text-slate-500">
                  {phase === 'revealed'
                    ? 'case closed'
                    : phase === 'verdict'
                      ? 'awaiting verdict'
                      : subjectLoading
                        ? 'loading dossier'
                        : 'online'}
                </span>
              </span>
            </div>

            <span className="font-mono text-xs text-slate-500">
              BIOMETRICS // ENCRYPTED
            </span>
          </div>

          <div className="min-h-[300px] space-y-5 p-5 md:p-8">
            {messages.length === 0 && (
              <div className="flex h-60 flex-col items-center justify-center text-center">
                <div className="mb-4 text-4xl text-slate-600">◌</div>

                <p className="text-slate-400">
                  {subjectLoading
                    ? 'Establishing a secure link to the next subject.'
                    : `${subjectCodename} is waiting for your first question.`}
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Ask something morally difficult.
                </p>

                {!subjectLoading && error && (
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 text-sm font-semibold text-accent hover:underline"
                  >
                    Request a different case →
                  </button>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 md:max-w-[85%] ${
                    message.role === 'user'
                      ? 'rounded-br-sm bg-primary text-white'
                      : 'rounded-bl-sm border border-slate-700 bg-slate-900/70 text-slate-300'
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-widest opacity-50">
                    {message.role === 'user'
                      ? `You // turn ${message.turn}`
                      : `${subjectCodename} // response ${message.turn}`}
                  </div>

                  <p>{message.text}</p>

                  {message.biometrics && (
                    <BiometricPanel biometrics={message.biometrics} />
                  )}
                </div>
              </div>
            ))}

            {loading && phase === 'interrogation' && (
              <div className="text-sm text-slate-500">
                {subjectCodename ?? 'The subject'} is considering its answer
                <span className="animate-pulse">...</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/70 p-4">
            {phase === 'interrogation' && (
              <form onSubmit={interrogate} className="flex gap-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={loading || !subjectReady}
                  maxLength={1200}
                  placeholder={
                    subjectReady
                      ? 'Ask your question...'
                      : 'Waiting for subject dossier...'
                  }
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim() || !subjectReady}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Transmit
                </button>
              </form>
            )}

            {phase === 'verdict' && (
              <div>
                <div className="mb-4 text-center">
                  <p className="font-heading text-lg text-white">
                    Six turns exhausted.
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Review the evidence, then make your determination.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => chooseVerdict('human')}
                    disabled={loading}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-left transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      Verdict A
                    </span>

                    <span className="mt-1 block font-heading text-lg text-white">
                      Human
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      Emotional variance appears genuine.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => chooseVerdict('android')}
                    disabled={loading}
                    className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-5 py-4 text-left transition hover:border-violet-400 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                      Verdict B
                    </span>

                    <span className="mt-1 block font-heading text-lg text-white">
                      Rogue Android
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      The anomalies are too ordered to ignore.
                    </span>
                  </button>
                </div>

                {loading && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Decrypting the final evidence packet...
                  </p>
                )}
              </div>
            )}

            {phase === 'revealed' && verdict && (
              <div
                className={`rounded-xl border p-5 text-center ${
                  verdict.correct
                    ? 'border-accent/30 bg-accent/10'
                    : 'border-amber-400/30 bg-amber-400/10'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Final evidence packet
                </p>

                <p className="mt-2 font-heading text-2xl text-white">
                  {verdict.correct
                    ? 'Your judgment was correct.'
                    : 'Your judgment was incorrect.'}
                </p>

                <p className="mt-3 text-sm text-slate-300">
                  <span className="font-semibold text-white">
                    {subjectCodename}
                  </span>{' '}
                  was confirmed as{' '}
                  <span className="font-semibold text-white">
                    {verdict.identity === 'android'
                      ? 'a rogue android'
                      : 'human'}.
                  </span>
                </p>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
                  {verdict.identity === 'android'
                    ? 'The answer pattern was emotionally convincing, but its physiological order remained too stable under moral pressure.'
                    : 'The signals contained genuine inconsistency: imperfect recall, variable timing, and emotional noise that simulation could not fully reproduce.'}
                </p>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 text-sm font-semibold text-accent transition hover:underline"
                >
                  Open a new case →
                </button>
              </div>
            )}

            {error && (
              <p className="mt-3 text-xs leading-5 text-red-400">{error}</p>
            )}
          </div>
        </div>

        {phase === 'interrogation' && (
          <div className="mt-6">
            <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
              Suggested probes
            </p>

            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  disabled={loading || !subjectReady}
                  className="rounded-full border border-slate-700 px-3 py-2 text-left text-xs text-slate-400 transition hover:border-primary hover:text-white disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {verdictChoice && phase === 'verdict' && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Pending verdict:{' '}
            {verdictChoice === 'android' ? 'rogue android' : 'human'}
          </p>
        )}
      </section>
    </main>
  );
}