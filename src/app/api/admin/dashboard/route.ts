import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { statusFilterInMany } from '@/lib/status';

// GET - Fetch dashboard statistics (optimized — no full table scan)
export async function GET() {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // ─── Core counts (parallel, DB-level) ───
    const [
      totalQR,
      qrActivatedHajj,
      qrActivatedVoyageur,
      expiringSoon,
      agenciesCount,
    ] = await Promise.all([
      db.baggage.count(),
      // Hajj + active (activated | active | scanned)
      db.baggage.count({
        where: {
          type: 'hajj',
          status: statusFilterInMany(['activated', 'active', 'scanned']),
        },
      }),
      // Voyageur + active
      db.baggage.count({
        where: {
          type: 'voyageur',
          status: statusFilterInMany(['activated', 'active', 'scanned']),
        },
      }),
      // Expiring within 7 days
      db.baggage.count({
        where: {
          expiresAt: { gt: now, lte: sevenDaysFromNow },
        },
      }),
      db.agency.count(),
    ]);

    // ─── Unique pilgrims / travelers via groupBy ───
    // Hajj pilgrims: distinct (firstName, lastName) pairs among hajj baggages with a name
    const [hajjNamesGrouped, voyageurNamesGrouped] = await Promise.all([
      db.baggage.groupBy({
        by: ['travelerFirstName', 'travelerLastName'],
        where: {
          type: 'hajj',
          travelerFirstName: { not: null },
        },
        _count: true,
      }),
      db.baggage.groupBy({
        by: ['travelerFirstName', 'travelerLastName'],
        where: {
          type: 'voyageur',
          travelerFirstName: { not: null },
        },
        _count: true,
      }),
    ]);

    // groupBy returns one row per distinct (firstName, lastName) combination,
    // so the array length IS the count of unique names.
    const uniquePelerins = hajjNamesGrouped.length;
    const uniqueVoyageurs = voyageurNamesGrouped.length;

    // ─── Daily activations for the last 7 days (DB-level) ───
    const last7Days: { day: string; count: number }[] = [];
    const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Build 7 parallel count queries for each day
    const dayCounts = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
        return db.baggage.count({
          where: {
            type: 'hajj',
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }).then(count => {
          const dayIndex = date.getDay();
          last7Days.push({
            day: dayLabels[dayIndex],
            count: Math.floor(count / 3), // Divide by 3 to get pilgrim count
          });
          return count;
        });
      })
    );
    // Suppress unused variable warning
    void dayCounts;

    // ─── Recent activities from scan logs ───
    const recentScans = await db.scanLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        baggage: {
          select: {
            reference: true,
            type: true,
            travelerFirstName: true,
            travelerLastName: true,
          }
        }
      }
    });

    // Format recent activities
    type ActivityType = {
      id: string;
      type: 'scan' | 'activation';
      name: string;
      reference: string;
      time: string;
      details: string;
      status: 'success';
    };

    const recentActivities: ActivityType[] = recentScans.map((scan) => {
      const timeAgo = getTimeAgo(new Date(scan.createdAt));
      const name = scan.baggage.travelerFirstName 
        ? `${scan.baggage.travelerFirstName} ${scan.baggage.travelerLastName || ''} - ${scan.baggage.type === 'hajj' ? 'Hajj' : 'Voyageur'}`
        : `Scan ${scan.baggage.reference}`;

      return {
        id: scan.id,
        type: 'scan' as const,
        name,
        reference: scan.baggage.reference,
        time: timeAgo,
        details: scan.location || 'Position non partagée',
        status: 'success' as const,
      };
    });

    // If no scans, add placeholder activities from recent activations (small, bounded query)
    if (recentActivities.length === 0) {
      const recentActivationsData = await db.baggage.findMany({
        where: {
          status: statusFilterInMany(['activated', 'active', 'scanned']),
          travelerFirstName: { not: null },
        },
        select: {
          travelerFirstName: true,
          travelerLastName: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const recentActivations: ActivityType[] = recentActivationsData.map((b, index) => ({
        id: `activation-${index}`,
        type: 'activation' as const,
        name: `${b.travelerFirstName} ${b.travelerLastName || ''} - ${b.type === 'hajj' ? 'Hajj' : 'Voyageur'}`,
        reference: '',
        time: getTimeAgo(new Date(b.createdAt)),
        details: b.type === 'hajj' ? '3 QR activés' : '1 QR activé',
        status: 'success' as const,
      }));

      recentActivities.push(...recentActivations);
    }

    const stats = {
      totalQR,
      qrActivatedHajj,
      qrActivatedVoyageur,
      totalPelerins: uniquePelerins,
      totalVoyageurs: uniqueVoyageurs,
      expiringSoon,
      pendingOrders: 0, // Placeholder for B2B orders feature
      totalAgencies: agenciesCount,
    };

    return NextResponse.json({
      stats,
      dailyActivations: last7Days,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString('fr-FR');
}
