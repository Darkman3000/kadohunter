import { useEffect, useState } from 'react';
import type { HealthResponse, SessionResponse } from '@kado/contracts';
import { projectName } from '@kado/domain';
import { palette, radii, spacing } from '@kado/ui';
import { fetchHealth, fetchSession } from './lib/api';

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [healthResponse, sessionResponse] = await Promise.all([fetchHealth(), fetchSession()]);

        if (!cancelled) {
          setHealth(healthResponse);
          setSession(sessionResponse);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unknown error');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: spacing.xxl,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <section
        style={{
          width: 'min(720px, 100%)',
          background: palette.surface,
          borderRadius: radii.lg,
          border: `1px solid ${palette.border}`,
          boxShadow: `0 24px 60px ${palette.shadow}`,
          padding: spacing.xxl,
          display: 'grid',
          gap: spacing.lg,
        }}
      >
        <div>
          <p style={{ margin: 0, color: palette.accent, fontWeight: 700 }}>Starter Surface</p>
          <h1 style={{ margin: `${spacing.sm}px 0 0`, fontSize: '2.5rem' }}>{projectName}</h1>
          <p style={{ margin: `${spacing.md}px 0 0`, color: palette.muted }}>
            This is a generic web shell wired to the shared backend health and session routes.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gap: spacing.md,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          <article style={{ background: palette.panel, borderRadius: radii.md, padding: spacing.lg }}>
            <strong>Backend status</strong>
            <p style={{ marginBottom: 0 }}>{health?.status ?? 'loading'}</p>
          </article>
          <article style={{ background: palette.panel, borderRadius: radii.md, padding: spacing.lg }}>
            <strong>Session state</strong>
            <p style={{ marginBottom: 0 }}>{session?.session.state ?? 'loading'}</p>
          </article>
          <article style={{ background: palette.panel, borderRadius: radii.md, padding: spacing.lg }}>
            <strong>Configured auth</strong>
            <p style={{ marginBottom: 0 }}>{session ? String(session.auth.configured) : 'loading'}</p>
          </article>
        </div>

        <pre
          style={{
            margin: 0,
            padding: spacing.lg,
            borderRadius: radii.md,
            background: '#101828',
            color: '#f8fafc',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify({ health, session, error }, null, 2)}
        </pre>
      </section>
    </main>
  );
}