import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IGameDetailAbout {
  summary?: string | null;
  storyLine?: string | null;
}

function GameDetailAbout({ summary, storyLine }: IGameDetailAbout) {
  const text = summary ?? storyLine;
  if (!text) return null;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='font-sans text-sm leading-relaxed text-grimoire-muted'>{text}</p>
      </CardContent>
    </Card>
  );
}

export default GameDetailAbout;
