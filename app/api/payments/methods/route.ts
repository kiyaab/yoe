import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cbeAccount = (await prisma.systemSetting.findUnique({ where: { key: 'CBE_ACCOUNT_NUMBER' } }))?.value || '1000234567890';
    const cbeName = (await prisma.systemSetting.findUnique({ where: { key: 'CBE_ACCOUNT_NAME' } }))?.value || 'Yalfal Online Eta Lottery';
    const telebirrPhone = (await prisma.systemSetting.findUnique({ where: { key: 'TELEBIRR_PHONE' } }))?.value || '0911223344';
    const telebirrName = (await prisma.systemSetting.findUnique({ where: { key: 'TELEBIRR_ACCOUNT_NAME' } }))?.value || 'Yalfal Online Eta';
    const supportContact = (await prisma.systemSetting.findUnique({ where: { key: 'SUPPORT_TELEGRAM' } }))?.value || '@yalfalsupport';

    return NextResponse.json({
      methods: [
        {
          code: 'CBE',
          title: 'Commercial Bank of Ethiopia (CBE)',
          accountNumber: cbeAccount,
          accountName: cbeName,
          instructions: 'Transfer 100 ETB via CBE Birr or CBE Mobile Banking. Take a screenshot of the completed transfer.',
          badge: 'Most Popular',
        },
        {
          code: 'TELEBIRR',
          title: 'Ethio Telecom Telebirr',
          accountNumber: telebirrPhone,
          accountName: telebirrName,
          instructions: 'Send 100 ETB via Telebirr app or *127#. Take a screenshot of the SMS or transaction receipt.',
          badge: 'Instant Transfer',
        },
      ],
      support: supportContact,
    });
  } catch (err) {
    return NextResponse.json({
      methods: [
        {
          code: 'CBE',
          title: 'Commercial Bank of Ethiopia (CBE)',
          accountNumber: '1000234567890',
          accountName: 'Yalfal Online Eta Lottery',
          instructions: 'Transfer 100 ETB via CBE Birr or CBE Mobile Banking. Take a screenshot of the completed transfer.',
          badge: 'Most Popular',
        },
        {
          code: 'TELEBIRR',
          title: 'Ethio Telecom Telebirr',
          accountNumber: '0911223344',
          accountName: 'Yalfal Online Eta',
          instructions: 'Send 100 ETB via Telebirr app or *127#. Take a screenshot of the SMS or transaction receipt.',
          badge: 'Instant Transfer',
        },
      ],
      support: '@yalfalsupport',
    });
  }
}
