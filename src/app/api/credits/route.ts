import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Lütfen giriş yapın." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { credit_balance: true },
    });

    const transactions = await prisma.creditTransaction.findMany({
      where: { user_id: currentUser.id },
      orderBy: { created_at: "desc" },
    });

    const totalEarned = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return NextResponse.json({
      balance: user?.credit_balance ?? 0,
      total_earned: totalEarned,
      total_spent: totalSpent,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        balance_after: t.balance_after,
        transaction_type: t.transaction_type,
        description: t.description,
        created_at: t.created_at,
      })),
    });
  } catch (error) {
    console.error("Credits error:", error);
    return NextResponse.json({ error: "Kredi bilgileri getirilemedi" }, { status: 500 });
  }
}
