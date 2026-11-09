import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Veritabanı başlatılıyor...");

  // 1. Sistem Ayarları
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      app_creation_cost: 10,
      reward_per_approved_test: 1,
      target_tester_count: 20,
      max_active_apps_per_user: 5,
      reminder_cooldown_hours: 24,
      allow_new_registrations: true,
    },
  });

  // 2. Kullanıcılar
  // Admin kullanıcısı
  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      email: "admin@gmail.com",
      name: "Sistem Yöneticisi",
      role: "ADMIN",
      credit_balance: 50,
      email_notifications: true,
    },
  });

  // Uur (Mockup'taki ana kullanıcı)
  const uur = await prisma.user.upsert({
    where: { email: "uur@gmail.com" },
    update: {},
    create: {
      email: "uur@gmail.com",
      name: "Uur",
      role: "USER",
      credit_balance: 7,
      email_notifications: true,
    },
  });

  // Diğer geliştiriciler
  const dev1 = await prisma.user.upsert({
    where: { email: "ahmet.dev@gmail.com" },
    update: {},
    create: {
      email: "ahmet.dev@gmail.com",
      name: "Ahmet Yılmaz",
      role: "USER",
      credit_balance: 15,
      email_notifications: true,
    },
  });

  const dev2 = await prisma.user.upsert({
    where: { email: "selin.app@gmail.com" },
    update: {},
    create: {
      email: "selin.app@gmail.com",
      name: "Selin Kaya",
      role: "USER",
      credit_balance: 12,
      email_notifications: true,
    },
  });

  // Mockup'taki 13 tester kullanıcısı (Brandlook için)
  const testerEmails = [
    "mert.kaya@gmail.com",
    "can.arslan@gmail.com",
    "zeynep.demir@gmail.com",
    "baris.turan@gmail.com",
    "elif.sahin@gmail.com",
    "burak.yildiz@gmail.com",
    "deniz.celik@gmail.com",
    "gamze.kurt@gmail.com",
    "ali.ozdemir@gmail.com",
    "ayse.polat@gmail.com",
    "mehmet.avci@gmail.com",
    "seda.yilmaz@gmail.com",
    "oguz.koc@gmail.com",
  ];

  const testers: { id: string; email: string }[] = [];
  for (const tEmail of testerEmails) {
    const t = await prisma.user.upsert({
      where: { email: tEmail },
      update: {},
      create: {
        email: tEmail,
        name: tEmail.split("@")[0].replace(".", " "),
        credit_balance: 3,
      },
    });
    testers.push({ id: t.id, email: t.email });
  }

  // 3. Uygulamalar
  // Brandlook (Uur'un veya Ahmet'in uygulaması - promptta hem Uur test ediyor hem Brandlook mockup'ta var)
  // Let's create Brandlook owned by dev1 so Uur can test it, AND let's create another app owned by Uur so Uur can see "Benim Uygulamalarım"!
  // Wait! In the mockup:
  // Screen 4: "Merhaba Uur, Kredin 7" -> Brandlook listeleniyor (14/20 Testçi)
  // Screen 7: "Testlerim" -> Brandlook (Onay Bekliyor), Durbasma (Onaylandı), HafifSepet (Devam Ediyor)
  // Screen 10: "Benim Uygulamalarım" -> Brandlook (14/20 Testçi, 9 Onaylanan, 5 Onay Bekleyen)
  // To allow Uur to view both as app owner AND as tester in demo/testing, we can assign Brandlook to Uur, OR we can allow user to test other apps and own Brandlook. Let's make Brandlook owned by Uur so Uur's "Benim Uygulamalarım" has Brandlook with 14 testers!
  // And let's make Durbasma and HafifSepet owned by other developers so Uur participates in them. And in Testlerim, Uur can have participations in Durbasma, HafifSepet, and Planly!
  // Even better: Let's make Brandlook owned by Uur so Uur has the full owner dashboard, and let Uur participate in Durbasma and HafifSepet!

  // Brandlook (Uur'un Uygulaması)
  const brandlook = await prisma.app.upsert({
    where: { id: "app-brandlook" },
    update: {},
    create: {
      id: "app-brandlook",
      owner_id: uur.id,
      name: "Brandlook",
      category: "Fotoğraf • Yapay Zeka",
      description: "Yapay zeka ile marka içerikleri ve sosyal medya görselleri oluşturun.",
      icon_url: "/icons/brandlook.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.brandlook.ai",
      store_url: "https://play.google.com/store/apps/details?id=com.brandlook.ai",
      status: "ACTIVE",
      target_tester_count: 20,
      current_tester_count: 14,
      note_for_testers: "Lütfen profil oluşturup en az 1 yapay zeka görseli üretin ve geri bildirim verin.",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  // Durbasma (Ahmet'in Uygulaması)
  const durbasma = await prisma.app.upsert({
    where: { id: "app-durbasma" },
    update: {},
    create: {
      id: "app-durbasma",
      owner_id: dev1.id,
      name: "Durbasma",
      category: "Oyun",
      description: "Eğlenceli refleks ve süre yarış oyunu.",
      icon_url: "/icons/durbasma.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.durbasma.game",
      store_url: "https://play.google.com/store/apps/details?id=com.durbasma.game",
      status: "ACTIVE",
      target_tester_count: 20,
      current_tester_count: 9,
      note_for_testers: "1. bölümü bitirip skor tablosunu test edin.",
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  // HafifSepet (Selin'in Uygulaması)
  const hafifSepet = await prisma.app.upsert({
    where: { id: "app-hafifsepet" },
    update: {},
    create: {
      id: "app-hafifsepet",
      owner_id: dev2.id,
      name: "HafifSepet",
      category: "Alışveriş & Fiyat",
      description: "Market fiyatlarını karşılaştırın, en uygun sepeti oluşturun.",
      icon_url: "/icons/hafifsepet.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.hafifsepet.app",
      store_url: "https://play.google.com/store/apps/details?id=com.hafifsepet.app",
      status: "ACTIVE",
      target_tester_count: 20,
      current_tester_count: 6,
      note_for_testers: "Sepete 3 ürün ekleyip market karşılaştırmasını deneyin.",
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  // Planly (Dev1'in 2. Uygulaması - 19/20)
  const planly = await prisma.app.upsert({
    where: { id: "app-planly" },
    update: {},
    create: {
      id: "app-planly",
      owner_id: dev1.id,
      name: "Planly",
      category: "Verimlilik",
      description: "Minimalist günlük alışkanlık ve odaklanma takipçisi.",
      icon_url: "/icons/planly.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.planly.tracker",
      store_url: "https://play.google.com/store/apps/details?id=com.planly.tracker",
      status: "ACTIVE",
      target_tester_count: 20,
      current_tester_count: 19,
      note_for_testers: "Günlük hedef oluşturup bildirimleri açın.",
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
  });

  // FitPulse (Kontenjanı Dolan Uygulama - 20/20)
  const fitpulse = await prisma.app.upsert({
    where: { id: "app-fitpulse" },
    update: {},
    create: {
      id: "app-fitpulse",
      owner_id: dev2.id,
      name: "FitPulse",
      category: "Sağlık & Spor",
      description: "Evde ekipmansız antrenman ve su takip yardımcısı.",
      icon_url: "/icons/fitpulse.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.fitpulse.health",
      store_url: "https://play.google.com/store/apps/details?id=com.fitpulse.health",
      status: "ACTIVE",
      target_tester_count: 20,
      current_tester_count: 20,
      note_for_testers: "Kontenjan doldu, ilginiz için teşekkürler.",
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Brandlook için 14 Test Katılımı (9 Onaylanan, 5 Onay Bekleyen)
  for (let i = 0; i < testers.length; i++) {
    const isApproved = i < 9;
    const status = isApproved ? "APPROVED" : "CLAIMED_TESTED";
    await prisma.testParticipation.upsert({
      where: {
        app_id_user_id: {
          app_id: brandlook.id,
          user_id: testers[i].id,
        },
      },
      update: {},
      create: {
        app_id: brandlook.id,
        user_id: testers[i].id,
        status: status,
        joined_at: new Date(Date.now() - (10 - i * 0.5) * 24 * 60 * 60 * 1000),
        invited_at: new Date(Date.now() - (9 - i * 0.5) * 24 * 60 * 60 * 1000),
        claimed_tested_at: new Date(Date.now() - (8 - i * 0.5) * 24 * 60 * 60 * 1000),
        approved_at: isApproved ? new Date(Date.now() - (7 - i * 0.5) * 24 * 60 * 60 * 1000) : null,
        feedback_type: isApproved ? "NO_PROBLEM" : "SUGGESTION",
        feedback_text: isApproved
          ? "Uygulama gayet akıcı çalışıyor, yapay zeka çıktısı hızlı geldi."
          : "Görsel indirirken küçük bir gecikme oldu ama genel olarak çok beğendim.",
      },
    });
  }

  // 14. tester olarak ek bir testçi
  const extraTester = await prisma.user.upsert({
    where: { email: "kubra.tas@gmail.com" },
    update: {},
    create: {
      email: "kubra.tas@gmail.com",
      name: "Kübra Taş",
      credit_balance: 1,
    },
  });
  await prisma.testParticipation.upsert({
    where: {
      app_id_user_id: {
        app_id: brandlook.id,
        user_id: extraTester.id,
      },
    },
    update: {},
    create: {
      app_id: brandlook.id,
      user_id: extraTester.id,
      status: "CLAIMED_TESTED",
      joined_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      invited_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      claimed_tested_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      feedback_type: "NO_PROBLEM",
      feedback_text: "Tüm butonları test ettim, crash yaşamadım.",
    },
  });

  // 5. Uur'un Diğer Uygulamalara Katılımları (Testlerim sekmesi için)
  // Durbasma: APPROVED (Onaylandı)
  await prisma.testParticipation.upsert({
    where: {
      app_id_user_id: {
        app_id: durbasma.id,
        user_id: uur.id,
      },
    },
    update: {},
    create: {
      app_id: durbasma.id,
      user_id: uur.id,
      status: "APPROVED",
      joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      invited_at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000),
      claimed_tested_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      approved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      feedback_type: "NO_PROBLEM",
      feedback_text: "Oyun çok akıcı, süre sayacı doğru çalışıyor.",
    },
  });

  // HafifSepet: JOINED / INVITED (Devam Ediyor)
  await prisma.testParticipation.upsert({
    where: {
      app_id_user_id: {
        app_id: hafifSepet.id,
        user_id: uur.id,
      },
    },
    update: {},
    create: {
      app_id: hafifSepet.id,
      user_id: uur.id,
      status: "INVITED",
      joined_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      invited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Planly: CLAIMED_TESTED (Onay Bekliyor)
  await prisma.testParticipation.upsert({
    where: {
      app_id_user_id: {
        app_id: planly.id,
        user_id: uur.id,
      },
    },
    update: {},
    create: {
      app_id: planly.id,
      user_id: uur.id,
      status: "CLAIMED_TESTED",
      joined_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      invited_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      claimed_tested_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      feedback_type: "SUGGESTION",
      feedback_text: "Karanlık mod desteği eklenirse çok daha iyi olur.",
    },
  });

  // 6. Uur'un Kredi Hareketleri (Mockup'taki ekran 12 ile tam uyumlu)
  await prisma.creditTransaction.createMany({
    data: [
      {
        user_id: uur.id,
        app_id: durbasma.id,
        amount: 1,
        balance_after: 7,
        transaction_type: "TEST_REWARD",
        description: "Test Onayı - Durbasma",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: uur.id,
        app_id: brandlook.id,
        amount: -10,
        balance_after: 6,
        transaction_type: "APP_PUBLISH",
        description: "Uygulama Yayınlama (Brandlook)",
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: uur.id,
        amount: 1,
        balance_after: 16,
        transaction_type: "TEST_REWARD",
        description: "Test Onayı - HafifSepet (Önceki Sürüm)",
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: uur.id,
        amount: 15,
        balance_after: 15,
        transaction_type: "STARTER_CREDIT",
        description: "Başlangıç Kredisi",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 7. Bildirimler (Uur için)
  await prisma.notification.createMany({
    data: [
      {
        user_id: uur.id,
        type: "NEW_TESTER",
        title: "Yeni Testçi Katıldı",
        message: "Brandlook uygulamanıza yeni bir testçi katıldı. Gmail listesini Play Console'a ekleyin.",
        link: "/apps/brandlook/manage",
        is_read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        user_id: uur.id,
        type: "INVITATION_READY",
        title: "Davet Hazır!",
        message: "HafifSepet uygulamasının Google Play kapalı test daveti hazır.",
        link: "/tests",
        is_read: false,
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        user_id: uur.id,
        type: "TEST_APPROVED",
        title: "Testiniz Onaylandı! 🎉",
        message: "Durbasma testi onaylandı ve hesabınıza 1 kredi tanımlandı.",
        link: "/credits",
        is_read: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Veritabanı başarıyla dolduruldu!");
  console.log("👤 Giriş yapılabilecek hesaplar:");
  console.log("   - uur@gmail.com (Standart Kullanıcı - 7 Kredi)");
  console.log("   - admin@gmail.com (Yönetici - 50 Kredi)");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
