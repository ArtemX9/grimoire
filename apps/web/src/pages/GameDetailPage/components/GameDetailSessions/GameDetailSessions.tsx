import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type GameSession = {
  id: string;
  startedAt: string | Date;
  durationMin?: number | null;
};

interface IGameDetailSessions {
  sessions: GameSession[];
}

function GameDetailSessions({ sessions }: IGameDetailSessions) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle>Sessions</CardTitle>
          <span className='font-sans text-xs text-grimoire-muted'>
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        {sessions.length === 0 ? renderEmpty() : renderList()}
      </CardContent>
    </Card>
  );

  function renderEmpty() {
    return (
      <p className='py-4 text-center font-sans text-sm text-grimoire-faint'>No sessions logged yet</p>
    );
  }

  function renderList() {
    return (
      <div className='flex flex-col divide-y divide-grimoire-border'>
        {sessions.map((session) => (
          <div key={session.id} className='flex items-center justify-between py-2.5'>
            <span className='font-sans text-sm text-grimoire-muted'>
              {new Date(session.startedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className='font-sans text-sm text-grimoire-ink'>
              {session.durationMin ? `${session.durationMin} min` : '—'}
            </span>
          </div>
        ))}
      </div>
    );
  }
}

export default GameDetailSessions;
