import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isFuzzyMatch } from "@/lib/similarity";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Lütfen giriş yapın." }, { status: 401 });
    }

    // Check if user is suspended
    const userInDb = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, warning_count: true, is_suspended: true, suspension_reason: true },
    });

    if (userInDb?.is_suspended) {
      return NextResponse.json(
        { error: "Hesabınız 3 uyarı sınırına ulaştığı için sistemden uzaklaştırılmıştır." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { feedback_type, feedback_text, tester_answer } = body;

    const validTypes = ["NO_PROBLEM", "BUG_FOUND", "SUGGESTION"];
    if (!feedback_type || !validTypes.includes(feedback_type)) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir geri bildirim seçeneği belirleyin." },
        { status: 400 }
      );
    }

    const participation = await prisma.testParticipation.findUnique({
      where: {
        app_id_user_id: {
          app_id: appId,
          user_id: currentUser.id,
        },
      },
      include: {
        app: true,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Bu uygulamaya henüz katılmadınız." },
        { status: 400 }
      );
    }

    if (participation.is_locked_out) {
      return NextResponse.json(
        { error: "Bu projede 2 kez hatalı doğrulama yaptığınız için katılımınız kapatılmıştır. Tekrar başvuramazsınız." },
        { status: 400 }
      );
    }

    if (participation.status === "APPROVED") {
      return NextResponse.json(
        { error: "Bu test zaten onaylanmış durumda." },
        { status: 400 }
      );
    }

    // Verification Question & Answer Check (with Fuzzy matching & 2-attempt penalty)
    if (participation.app.verification_question && participation.app.verification_answer) {
      if (!tester_answer || typeof tester_answer !== "string" || !tester_answer.trim()) {
        return NextResponse.json(
          { error: "Lütfen geliştiricinin belirlediği doğrulama sorusunu yanıtlayın." },
          { status: 400 }
        );
      }

      const match = isFuzzyMatch(participation.app.verification_answer, tester_answer, 0.70);

      if (!match.matched) {
        const nextFailedAttempts = (participation.failed_attempts || 0) + 1;

        if (nextFailedAttempts < 2) {
          // 1st failed attempt -> Record and warn user
          await prisma.testParticipation.update({
            where: { id: participation.id },
            data: { failed_attempts: nextFailedAttempts },
          });

          return NextResponse.json(
            {
              error: `Doğrulama yanıtınız hatalı (%${match.score} benzerlik, en az %70 gerekli). Son 1 deneme hakkınız kaldı! 2. hatalı yanıtta bu proje kalıcı olarak kapatılır ve 1 uyarı alırsınız.`,
              remaining_attempts: 1,
              score: match.score,
            },
            { status: 400 }
          );
        } else {
          // 2nd failed attempt -> Lock out from this project & add warning to user
          const result = await prisma.$transaction(async (tx) => {
            // 1. Lock out participation & reject
            const updatedPart = await tx.testParticipation.update({
              where: { id: participation.id },
              data: {
                failed_attempts: 2,
                is_locked_out: true,
                status: "REJECTED",
                rejection_reason: "Doğrulama sorusuna 2 kez hatalı cevap verildi.",
                lockout_reason: "2 kez hatalı cevap nedeniyle proje kapatıldı.",
              },
            });

            // 2. Decrement app tester count so slot is reopened
            if (participation.app.current_tester_count > 0) {
              await tx.app.update({
                where: { id: participation.app_id },
                data: {
                  current_tester_count: { decrement: 1 },
                },
              });
            }

            // 3. Increment user warning count
            const currentWarnings = userInDb?.warning_count || 0;
            const newWarnings = currentWarnings + 1;
            const willSuspend = newWarnings >= 3;

            const updatedUser = await tx.user.update({
              where: { id: currentUser.id },
              data: {
                warning_count: newWarnings,
                is_suspended: willSuspend,
                suspension_reason: willSuspend
                  ? "3 kez doğrulama hatası / uyarı alındığı için sistemden uzaklaştırıldı."
                  : null,
              },
            });

            // 4. Create Notification
            await tx.notification.create({
              data: {
                user_id: currentUser.id,
                type: willSuspend ? "SYSTEM" : "TEST_REJECTED",
                title: willSuspend ? "Hesabınız Askıya Alındı 🚫" : "Uyarı Aldınız ⚠️",
                message: willSuspend
                  ? `3 uyarı sınırına ulaştığınız için hesabınız sistemden uzaklaştırıldı.`
                  : `"${participation.app.name}" projesinde 2 kez hatalı cevap verdiğiniz için proje kapatıldı ve 1 uyarı aldınız. (Toplam Uyarı: ${newWarnings}/3)`,
              },
            });

            return { updatedPart, updatedUser, willSuspend, newWarnings };
          });

          return NextResponse.json(
            {
              error: `2 kez hatalı cevap verdiniz! "${participation.app.name}" projesi sizin için kalıcı olarak kapatıldı ve 1 uyarı aldınız. (Toplam Uyarı: ${result.newWarnings}/3).${result.willSuspend ? " 3 uyarı sınırına ulaştığınız için hesabınız askıya alındı!" : ""}`,
              is_locked_out: true,
              is_suspended: result.willSuspend,
              warning_count: result.newWarnings,
            },
            { status: 400 }
          );
        }
      }
    }

    // System settings for reward amount (default: 1 credit)
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    const reward = settings?.reward_per_approved_test ?? 1;

    // AUTOMATIC INSTANT APPROVAL & REWARD (Owner approval no longer required!)
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Give +1 credit to tester
      const updatedUser = await tx.user.update({
        where: { id: currentUser.id },
        data: {
          credit_balance: { increment: reward },
        },
      });

      // 2. Mark participation as APPROVED immediately
      const now = new Date();
      const part = await tx.testParticipation.update({
        where: { id: participation.id },
        data: {
          status: "APPROVED",
          feedback_type,
          feedback_text: feedback_text?.trim() || null,
          tester_answer: tester_answer?.trim() || null,
          claimed_tested_at: now,
          approved_at: now,
        },
      });

      // 3. Log credit transaction
      await tx.creditTransaction.create({
        data: {
          user_id: currentUser.id,
          app_id: participation.app_id,
          participation_id: part.id,
          amount: reward,
          balance_after: updatedUser.credit_balance,
          transaction_type: "TEST_REWARD",
          description: `Test Doğrulama Ödülü (${participation.app.name})`,
        },
      });

      // 4. Notify tester
      await tx.notification.create({
        data: {
          user_id: currentUser.id,
          type: "TEST_APPROVED",
          title: "Kredi Kazandın! 🪙 +1",
          message: `"${participation.app.name}" testini başarıyla tamamladın ve doğruladın. +${reward} kredi hesabına anında yüklendi!`,
          link: "/?tab=profile",
        },
      });

      // 5. Notify app owner that test was completed & verified
      await tx.notification.create({
        data: {
          user_id: participation.app.owner_id,
          type: "TEST_CLAIMED",
          title: "Test Başarıyla Tamamlandı ✅",
          message: `${currentUser.name || currentUser.email} kullanıcısı "${participation.app.name}" uygulamanızı indirdi ve doğrulama sorusunu başarıyla yanıtladı.`,
          link: `/apps/${appId}/manage`,
        },
      });

      return { part, newBalance: updatedUser.credit_balance };
    });

    return NextResponse.json({
      success: true,
      message: `Tebrikler! Doğrulama başarılı oldu ve +${reward} kredi hesabınıza anında yüklendi! 🎉`,
      participation: updated.part,
      newBalance: updated.newBalance,
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return NextResponse.json(
      { error: "Geri bildirim gönderilemedi." },
      { status: 500 }
    );
  }
}
