import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { hasPro, createApiKey, getUserIdByApiKey } from '@/lib/store';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get('x-upshiftai-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  const userId = session?.user?.id ?? (apiKey ? await getUserIdByApiKey(apiKey) : null);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pro = await hasPro(userId);
  return Response.json({
    userId,
    email: session?.user?.email ?? null,
    subscription: pro ? 'pro' : 'free',
  });
}

export async function POST(req) {
  // Create API key (requires session)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const key = await createApiKey(session.user.id);
  return Response.json({ apiKey: key });
}
