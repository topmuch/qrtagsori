import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeStatus, statusFilterIn, statusFilterInMany } from '@/lib/status';
import type { BaggageStatus } from '@/lib/status';

export const dynamic = 'force-dynamic';

// GET - List baggages for an agency (paginated) with DB-level stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Build where clause — NO status filter by default (show ALL baggages)
    const where: Record<string, unknown> = { agencyId };

    // If a specific status filter is requested, match BOTH French and English variants
    if (status && status !== 'all') {
      where.status = statusFilterIn(status as BaggageStatus);
    }

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { travelerFirstName: { contains: search } },
        { travelerLastName: { contains: search } },
      ];
    }

    // Run paginated fetch + total count in parallel
    const [baggages, total] = await Promise.all([
      db.baggage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          agency: {
            select: { id: true, name: true, agencyType: true },
          },
        },
      }),
      db.baggage.count({ where }),
    ]);

    // Normalize statuses in response (frontend always gets English format)
    const normalizedBaggages = baggages.map(b => ({
      ...b,
      status: normalizeStatus(b.status),
      // QRTags : exposer agencyType (depuis l'agence) au niveau racine pour faciliter le frontend
      agencyType: b.agency?.agencyType || null,
    }));

    // ─── Compute stats at DB level using parallel count queries ───
    // These counts ignore the page/limit/search — they reflect the full agency dataset
    const statsBase = { agencyId };
    const [
      totalAll,
      pendingCount,
      activeCount,
      scannedCount,
      lostCount,
      foundCount,
      inStockCount,
      soldCount,
      activatedCount,
      assignedToAgencyCount,
      blockedCount,
    ] = await Promise.all([
      db.baggage.count({ where: statsBase }),
      // pending = in_stock + assigned_to_agency + pending_activation
      db.baggage.count({ where: { ...statsBase, status: statusFilterInMany(['in_stock', 'assigned_to_agency', 'pending_activation']) } }),
      // active = activated + active + scanned
      db.baggage.count({ where: { ...statsBase, status: statusFilterInMany(['activated', 'active', 'scanned']) } }),
      db.baggage.count({ where: { ...statsBase, status: statusFilterIn('scanned') } }),
      db.baggage.count({ where: { ...statsBase, status: statusFilterIn('lost') } }),
      db.baggage.count({ where: { ...statsBase, status: statusFilterIn('found') } }),
      db.baggage.count({ where: { ...statsBase, status: statusFilterIn('in_stock') } }),
      db.baggage.count({ where: { ...statsBase, status: statusFilterIn('sold') } }),
      db.baggage.count({ where: { ...statsBase, status: statusFilterIn('activated') } }),
      db.baggage.count({ where: { ...statsBase, status: statusFilterIn('assigned_to_agency') } }),
      db.baggage.count({ where: { ...statsBase, status: statusFilterIn('blocked') } }),
    ]);

    const stats = {
      total: totalAll,
      pending: pendingCount,
      active: activeCount,
      scanned: scannedCount,
      lost: lostCount,
      found: foundCount,
      in_stock: inStockCount,
      sold: soldCount,
      activated: activatedCount,
      assigned_to_agency: assignedToAgencyCount,
      blocked: blockedCount,
    };

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        baggages: normalizedBaggages,
        pagination: { page, limit, total, totalPages },
        stats,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

  } catch (error) {
    console.error('Get baggages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete baggages for an agency
// Body: { agencyId: string, ids: string[] } or { agencyId: string, status: 'pending_activation' }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, ids, status } = body;

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID requis' },
        { status: 400 }
      );
    }

    let where: Record<string, unknown> = { agencyId };

    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Delete specific baggage IDs
      where.id = { in: ids };
    } else if (status === 'pending_activation') {
      // Delete all pending activation baggages for this agency
      where.status = { in: ['pending_activation', 'en_attente'] };
    } else {
      return NextResponse.json(
        { error: 'Spécifiez les IDs à supprimer ou le statut "pending_activation"' },
        { status: 400 }
      );
    }

    // Safety: prevent deleting active/lost/found baggages unless explicitly by ID
    if (!ids) {
      // Only allow bulk delete by status for pending
      const count = await db.baggage.count({ where });
      if (count === 0) {
        return NextResponse.json(
          { error: 'Aucun baggage à supprimer avec ces critères' },
          { status: 404 }
        );
      }
    }

    const result = await db.baggage.deleteMany({ where });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} baggage(s) supprimé(s)`
    });
  } catch (error) {
    console.error('Bulk delete baggages error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
