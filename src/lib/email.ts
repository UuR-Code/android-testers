import { prisma } from "./prisma";

export interface SendEmailParams {
  to: string;
  subject: string;
  template: "OTP" | "NEW_TESTER" | "INVITATION_READY" | "REMINDER" | "TEST_APPROVED" | "TEST_REJECTED";
  html: string;
  text?: string;
}

/**
 * Sends an email using configured provider (Resend or SMTP),
 * or logs to database in simulated mode if no provider credentials exist.
 */
export async function sendEmail({ to, subject, template, html }: SendEmailParams): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  try {
    let status = "SIMULATED";
    let errorMessage: string | undefined;

    // Optional real Resend API integration
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.SMTP_FROM || "Android Test Havuzu <onboarding@resend.dev>",
            to,
            subject,
            html,
          }),
        });

        if (res.ok) {
          status = "SENT";
        } else {
          const errData = await res.json();
          errorMessage = JSON.stringify(errData);
          status = "FAILED";
        }
      } catch (err: any) {
        errorMessage = err?.message || "E-posta gönderim hatası";
        status = "FAILED";
      }
    }

    // Save log to DB
    await prisma.emailLog.create({
      data: {
        to_email: to,
        subject,
        template,
        status,
        error_message: errorMessage,
      },
    });

    return {
      success: status !== "FAILED",
      simulated: status === "SIMULATED",
      error: errorMessage,
    };
  } catch (error: any) {
    console.error("Email send fatal error:", error);
    return { success: false, simulated: true, error: error.message };
  }
}

/**
 * Send OTP Verification Email
 */
export async function sendOtpEmail(email: string, code: string) {
  const subject = `Android Test Havuzu — Giriş Doğrulama Kodun: ${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px; background-color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #6366F1; margin: 0; font-size: 24px; font-weight: 800;">Android Test Havuzu</h2>
        <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Kredi Tabanlı Kapalı Beta Test Platformu</p>
      </div>
      <div style="background-color: #F9FAFB; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="color: #374151; font-size: 14px; margin-bottom: 12px;">Giriş yapmak için tek kullanımlık 6 haneli doğrulama kodun:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4F46E5; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">Bu kod 5 dakika boyunca geçerlidir. Kodunuzu kimseyle paylaşmayın.</p>
      </div>
      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">Bu işlemi siz yapmadıysanız lütfen bu e-postayı dikkate almayın.</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, template: "OTP", html });
}

/**
 * Send New Tester Notification (to App Owner)
 */
export async function sendNewTesterNotification(ownerEmail: string, appName: string, testerEmail: string) {
  const subject = `Yeni Testçi Katıldı: ${appName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
      <h2 style="color: #6366F1; margin-top: 0;">Yeni Testçi Katıldı 🎉</h2>
      <p style="color: #374151; font-size: 15px;"><strong>${appName}</strong> uygulamanıza yeni bir testçi katıldı!</p>
      <div style="background: #EEF2FF; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
        <span style="color: #4338CA; font-weight: 600;">Testçi Gmail: </span>
        <span style="color: #1E1B4B;">${testerEmail}</span>
      </div>
      <p style="color: #4B5563; font-size: 14px;">Google Play Console kapalı test listenize bu e-postayı ekledikten sonra testçiye "Davet Hazır" bildirimi gönderebilirsiniz.</p>
    </div>
  `;
  return await sendEmail({ to: ownerEmail, subject, template: "NEW_TESTER", html });
}

/**
 * Send Invitation Ready Notification (to Tester)
 */
export async function sendInvitationReadyNotification(testerEmail: string, appName: string, optInUrl: string) {
  const subject = `Davetin Hazır: ${appName} Google Play Kapalı Testi`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
      <h2 style="color: #10B981; margin-top: 0;">Test Davetin Hazır! 🚀</h2>
      <p style="color: #374151; font-size: 15px;"><strong>${appName}</strong> geliştiricisi Gmail adresini Google Play Console testçi listesine ekledi.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${optInUrl}" style="background-color: #6366F1; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">
          Play Store Testine Katıl
        </a>
      </div>
      <p style="color: #6B7280; font-size: 13px;">Uygulamayı yükleyip denedikten sonra Android Test Havuzu'nda "Test Ettim" butonuna basarak onay ve kredi alabilirsiniz.</p>
    </div>
  `;
  return await sendEmail({ to: testerEmail, subject, template: "INVITATION_READY", html });
}

/**
 * Send Reminder Email (to Tester)
 */
export async function sendReminderEmail(testerEmail: string, appName: string, optInUrl: string) {
  const subject = `Hatırlatma: ${appName} testini tamamlayıp kredi kazanabilirsin`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
      <h2 style="color: #F59E0B; margin-top: 0;">Test Hatırlatması ⏰</h2>
      <p style="color: #374151; font-size: 15px;"><strong>${appName}</strong> uygulamasına katılımın bulunuyor ancak henüz test geri bildirimi göndermedin.</p>
      <p style="color: #4B5563; font-size: 14px;">Google Play üzerinden uygulamayı test edip onay alarak <strong>+1 Kredi</strong> kazanabilirsin.</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${optInUrl}" style="background-color: #6366F1; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          Test Sayfasına Git
        </a>
      </div>
    </div>
  `;
  return await sendEmail({ to: testerEmail, subject, template: "REMINDER", html });
}

/**
 * Send Test Approved Notification (to Tester)
 */
export async function sendTestApprovedNotification(testerEmail: string, appName: string) {
  const subject = `Tebrikler! ${appName} testin onaylandı (+1 Kredi)`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
      <h2 style="color: #10B981; margin-top: 0;">Testin Onaylandı! 🌟</h2>
      <p style="color: #374151; font-size: 15px;"><strong>${appName}</strong> uygulama geliştiricisi testini inceledi ve onayladı.</p>
      <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: 800; color: #047857;">+1 Kredi Kazandın</span>
      </div>
      <p style="color: #6B7280; font-size: 13px;">Kazandığın kredilerle kendi uygulamanı yayınlayabilir ve diğer geliştiricilerden testçi toplayabilirsin.</p>
    </div>
  `;
  return await sendEmail({ to: testerEmail, subject, template: "TEST_APPROVED", html });
}
