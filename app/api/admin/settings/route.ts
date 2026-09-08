import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { cbeAccount, cbeName, telebirrPhone, telebirrName, supportContact } = await req.json();

    const updates = [
      { key: 'CBE_ACCOUNT_NUMBER', value: cbeAccount },
      { key: 'CBE_ACCOUNT_NAME', value: cbeName },
      { key: 'TELEBIRR_PHONE', value: telebirrPhone },
      { key: 'TELEBIRR_ACCOUNT_NAME', value: telebirrName },
      { key: 'SUPPORT_TELEGRAM', value: supportContact },
    ];

    for (const item of updates) {
      if (item.value) {
        await prisma.systemSetting.upsert({
          where: { key: item.key },
          create: { key: item.key, value: item.value },
          update: { value: item.value },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
