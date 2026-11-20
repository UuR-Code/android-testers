import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Eski veriler temizleniyor...");

  // Cascade delete relations
  await prisma.notification.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.testParticipation.deleteMany();
  await prisma.app.deleteMany();
  await prisma.user.deleteMany();

  console.log("⚙️ Sistem ayarları yapılandırılıyor...");
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {
      app_creation_cost: 10,
      reward_per_approved_test: 1,
      target_tester_count: 20,
      max_active_apps_per_user: 5,
      reminder_cooldown_hours: 24,
      allow_new_registrations: true,
    },
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

  console.log("👥 Kullanıcılar oluşturuluyor...");
  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      name: "Sistem Yöneticisi",
      role: "ADMIN",
      credit_balance: 50,
      email_notifications: true,
    },
  });

  // 2. Uur (Ana Test / Demo Kullanıcısı)
  const uur = await prisma.user.create({
    data: {
      email: "uur@gmail.com",
      name: "Uur",
      role: "USER",
      credit_balance: 7,
      email_notifications: true,
      warning_count: 0,
    },
  });

  // 3. Geliştiriciler
  const devAhmet = await prisma.user.create({
    data: { email: "ahmet.dev@gmail.com", name: "Ahmet Yılmaz", credit_balance: 15 },
  });
  const devSelin = await prisma.user.create({
    data: { email: "selin.app@gmail.com", name: "Selin Kaya", credit_balance: 12 },
  });
  const devCan = await prisma.user.create({
    data: { email: "can.studio@gmail.com", name: "Can Arslan", credit_balance: 20 },
  });
  const devZeynep = await prisma.user.create({
    data: { email: "zeynep.labs@gmail.com", name: "Zeynep Demir", credit_balance: 14 },
  });
  const devBurak = await prisma.user.create({
    data: { email: "burak.code@gmail.com", name: "Burak Yıldız", credit_balance: 10 },
  });

  // 4. Havuz Testçileri (Katılımcı sayıları için)
  const poolTesterEmails = [
    "mert.kaya@gmail.com", "elif.sahin@gmail.com", "deniz.celik@gmail.com",
    "gamze.kurt@gmail.com", "ali.ozdemir@gmail.com", "ayse.polat@gmail.com",
    "mehmet.avci@gmail.com", "seda.yilmaz@gmail.com", "oguz.koc@gmail.com",
    "baris.turan@gmail.com", "emre.aksoy@gmail.com", "busra.tek@gmail.com",
    "kerem.tas@gmail.com", "ezgi.ay@gmail.com", "tolga.gul@gmail.com",
    "damla.sen@gmail.com", "serkan.erdem@gmail.com", "hande.koc@gmail.com",
    "kaan.yurt@gmail.com", "irem.ates@gmail.com"
  ];

  const poolTesters: any[] = [];
  for (const email of poolTesterEmails) {
    const t = await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0].replace(".", " "),
        credit_balance: 3,
      },
    });
    poolTesters.push(t);
  }

  console.log("📱 15 Örnek Uygulama oluşturuluyor...");
  const appsData = [
    {
      id: "app-brandlook",
      owner_id: uur.id, // Uur'un kendi uygulaması
      name: "Brandlook",
      category: "Fotoğraf • Yapay Zeka",
      description: "Yapay zeka ile marka içerikleri ve sosyal medya görselleri oluşturun.",
      icon_url: "/icons/brandlook.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.brandlook.ai",
      store_url: "https://play.google.com/store/apps/details?id=com.brandlook.ai",
      target_tester_count: 20,
      current_tester_count: 12,
      note_for_testers: "Lütfen en az 1 yapay zeka görseli üretin ve arayüz hızını inceleyin.",
      verification_question: "Açılış ekranındaki mor butonun üzerinde ne yazıyor?",
      verification_answer: "Hemen Başla",
      created_at: new Date(Date.now() - 10 * 86400000),
    },
    {
      id: "app-durbasma",
      owner_id: devAhmet.id,
      name: "Durbasma",
      category: "Oyun",
      description: "Eğlenceli refleks ve süre yarışına dayalı refleks testi oyunu.",
      icon_url: "/icons/durbasma.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.durbasma.game",
      store_url: "https://play.google.com/store/apps/details?id=com.durbasma.game",
      target_tester_count: 20,
      current_tester_count: 16,
      note_for_testers: "1. bölümü bitirip skor tablosunu test edin.",
      verification_question: "Oyun ana menüsündeki ilk butonun adı nedir?",
      verification_answer: "Oyuna Başla",
      created_at: new Date(Date.now() - 8 * 86400000),
    },
    {
      id: "app-hafifsepet",
      owner_id: devSelin.id,
      name: "HafifSepet",
      category: "Alışveriş & Fiyat",
      description: "Market fiyatlarını karşılaştırın, en uygun sepeti oluşturun.",
      icon_url: "/icons/hafifsepet.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.hafifsepet.app",
      store_url: "https://play.google.com/store/apps/details?id=com.hafifsepet.app",
      target_tester_count: 20,
      current_tester_count: 8,
      note_for_testers: "Sepete 3 ürün ekleyip market karşılaştırmasını deneyin.",
      verification_question: "Uygulama açılışında sepet tutarı varsayılan kaç TL?",
      verification_answer: "0 TL",
      created_at: new Date(Date.now() - 7 * 86400000),
    },
    {
      id: "app-planly",
      owner_id: devCan.id,
      name: "Planly",
      category: "Verimlilik",
      description: "Günlük görevlerinizi ve alışkanlıklarınızı minimalist takvimle yönetin.",
      icon_url: "/icons/planly.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.planly.calendar",
      store_url: "https://play.google.com/store/apps/details?id=com.planly.calendar",
      target_tester_count: 20,
      current_tester_count: 4,
      note_for_testers: "Yeni görev ekleyip hatırlatıcı alarmını test edin.",
      verification_question: "Günün görev ekleme butonunun rengi nedir?",
      verification_answer: "Mavi",
      created_at: new Date(Date.now() - 6 * 86400000),
    },
    {
      id: "app-fitpulse",
      owner_id: devZeynep.id,
      name: "FitPulse",
      category: "Sağlık & Spor",
      description: "Günlük su takibi, adım sayar ve evde hızlı egzersiz rehberi.",
      icon_url: "/icons/fitpulse.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.fitpulse.health",
      store_url: "https://play.google.com/store/apps/details?id=com.fitpulse.health",
      target_tester_count: 20,
      current_tester_count: 7,
      note_for_testers: "Boy ve kilo girip su tüketim hedefinizi oluşturun.",
      verification_question: "Profil oluştururken ilk sorulan ana hedef nedir?",
      verification_answer: "Kilo Verme",
      created_at: new Date(Date.now() - 5 * 86400000),
    },
    {
      id: "app-kelimebaz",
      owner_id: devBurak.id,
      name: "Kelimebaz",
      category: "Eğitim",
      description: "İngilizce kelimeleri aralıklı tekrar yöntemi ile eğlenerek ezberleyin.",
      icon_url: "/icons/kelimebaz.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.kelimebaz.english",
      store_url: "https://play.google.com/store/apps/details?id=com.kelimebaz.english",
      target_tester_count: 20,
      current_tester_count: 3,
      note_for_testers: "İlk 5 kelime kartını çevirip ses telaffuzunu deneyin.",
      verification_question: "Günün ilk kelime kartındaki İngilizce kelime nedir?",
      verification_answer: "Courage",
      created_at: new Date(Date.now() - 4 * 86400000),
    },
    {
      id: "app-hesapdefterim",
      owner_id: devAhmet.id,
      name: "HesapDefterim",
      category: "Finans",
      description: "Gelir ve giderlerinizi otomatik kategorize eden sade bütçe yöneticisi.",
      icon_url: "/icons/hesap.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.hesapdefterim.finance",
      store_url: "https://play.google.com/store/apps/details?id=com.hesapdefterim.finance",
      target_tester_count: 20,
      current_tester_count: 5,
      note_for_testers: "Hızlı harcama ekleyip pasta grafiğini kontrol edin.",
      verification_question: "Hızlı harcama ekleme butonunun simgesi nedir?",
      verification_answer: "Artı",
      created_at: new Date(Date.now() - 4 * 86400000),
    },
    {
      id: "app-seslinot",
      owner_id: devSelin.id,
      name: "SesliNot",
      category: "Araçlar",
      description: "Ses kayıtlarınızı anında Türkçe metne döken yapay zeka destekli not defteri.",
      icon_url: "/icons/seslinot.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.seslinot.app",
      store_url: "https://play.google.com/store/apps/details?id=com.seslinot.app",
      target_tester_count: 20,
      current_tester_count: 9,
      note_for_testers: "Mikrofon izni verip 10 saniyelik kısa bir not kaydedin.",
      verification_question: "Kayıt başlatma tuşunun altında ne yazıyor?",
      verification_answer: "Kayda Başla",
      created_at: new Date(Date.now() - 3 * 86400000),
    },
    {
      id: "app-kriptoradar",
      owner_id: devCan.id,
      name: "KriptoRadar",
      category: "Finans",
      description: "Kripto para ve borsa fiyat alarmlarını anlık bildirimle ileten takip platformu.",
      icon_url: "/icons/kripto.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.kriptoradar.tracker",
      store_url: "https://play.google.com/store/apps/details?id=com.kriptoradar.tracker",
      target_tester_count: 20,
      current_tester_count: 11,
      note_for_testers: "İstediğiniz bir coine fiyat alarmı kurun.",
      verification_question: "Varsayılan listede 1. sırada hangi coin yer alıyor?",
      verification_answer: "Bitcoin",
      created_at: new Date(Date.now() - 3 * 86400000),
    },
    {
      id: "app-ruyagunlugu",
      owner_id: devZeynep.id,
      name: "RüyaGünlüğü",
      category: "Sosyal",
      description: "Gördüğünüz rüyaları kaydedin ve yapay zeka ile temalarını analiz edin.",
      icon_url: "/icons/ruyagunlugu.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.ruyagunlugu.ai",
      store_url: "https://play.google.com/store/apps/details?id=com.ruyagunlugu.ai",
      target_tester_count: 20,
      current_tester_count: 2,
      note_for_testers: "Örnek bir rüya yazıp analiz butonuna basın.",
      verification_question: "İlk rüya ekleme ekranındaki ana başlık nedir?",
      verification_answer: "Bugün Ne Gördün?",
      created_at: new Date(Date.now() - 2 * 86400000),
    },
    {
      id: "app-tarifsepetim",
      owner_id: devBurak.id,
      name: "Tarif Sepetim",
      category: "Genel",
      description: "Evdeki malzemeleri seçin, yapabileceğiniz en lezzetli yemek tariflerini bulun.",
      icon_url: "/icons/tarif.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.tarifsepetim.recipes",
      store_url: "https://play.google.com/store/apps/details?id=com.tarifsepetim.recipes",
      target_tester_count: 20,
      current_tester_count: 6,
      note_for_testers: "Dolaptaki 2 malzemeyi işaretleyip tarif listeleyin.",
      verification_question: "Ana sayfadaki ilk kategorinin adı nedir?",
      verification_answer: "Çorbalar",
      created_at: new Date(Date.now() - 2 * 86400000),
    },
    {
      id: "app-molaver",
      owner_id: devAhmet.id,
      name: "MolaVer",
      category: "Verimlilik",
      description: "Pomodoro tekniği ile odaklanma sürelerinizi yönetin ve göz egzersizleri yapın.",
      icon_url: "/icons/molaver.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.molaver.pomodoro",
      store_url: "https://play.google.com/store/apps/details?id=com.molaver.pomodoro",
      target_tester_count: 20,
      current_tester_count: 14,
      note_for_testers: "25 dakikalık çalışma sayacını başlatıp durdurun.",
      verification_question: "Varsayılan odaklanma süresi kaç dakikadır?",
      verification_answer: "25 Dakika",
      created_at: new Date(Date.now() - 1 * 86400000),
    },
    {
      id: "app-barkodbul",
      owner_id: devSelin.id,
      name: "BarkodBul",
      category: "Alışveriş & Fiyat",
      description: "Herhangi bir ürünün barkodunu okutarak piyasadaki en uygun fiyatı bulun.",
      icon_url: "/icons/barkod.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.barkodbul.scanner",
      store_url: "https://play.google.com/store/apps/details?id=com.barkodbul.scanner",
      target_tester_count: 20,
      current_tester_count: 1,
      note_for_testers: "Kamera ile evdeki herhangi bir barkodu tarayın.",
      verification_question: "Kamera izin butonunda tam olarak ne yazıyor?",
      verification_answer: "İzin Ver",
      created_at: new Date(Date.now() - 1 * 86400000),
    },
    {
      id: "app-yildizname",
      owner_id: devCan.id,
      name: "Yıldızname",
      category: "Sosyal",
      description: "Günlük burç yorumları ve doğum haritası uyum analizi sunan eğlenceli astroloji rehberi.",
      icon_url: "/icons/yildizname.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.yildizname.horoscope",
      store_url: "https://play.google.com/store/apps/details?id=com.yildizname.horoscope",
      target_tester_count: 20,
      current_tester_count: 18,
      note_for_testers: "Doğum tarihinizi girip yükselen burcunuzu görüntüleyin.",
      verification_question: "Uygulama açılışında sorulan ilk bilgi nedir?",
      verification_answer: "Doğum Tarihi",
      created_at: new Date(Date.now() - 1 * 86400000),
    },
    {
      id: "app-sozlukcepte",
      owner_id: devZeynep.id,
      name: "Sözlük Cepte",
      category: "Eğitim",
      description: "TDK uyumlu kapsamlı Türkçe sözlük, atasözleri ve deyimler arama motoru.",
      icon_url: "/icons/sozluk.svg",
      opt_in_url: "https://play.google.com/apps/testing/com.sozlukcepte.tdk",
      store_url: "https://play.google.com/store/apps/details?id=com.sozlukcepte.tdk",
      target_tester_count: 20,
      current_tester_count: 19,
      note_for_testers: "Arama çubuğunda bir deyim aratıp sesli okunuşunu dinleyin.",
      verification_question: "Günün kelimesi kutucuğundaki kelime nedir?",
      verification_answer: "Muvaffakiyet",
      created_at: new Date(Date.now() - 12 * 3600000),
    },
  ];

  for (const app of appsData) {
    const createdApp = await prisma.app.create({ data: app });

    // Seed realistic participations for each app from poolTesters
    const testerCount = app.current_tester_count;
    for (let i = 0; i < testerCount; i++) {
      const tester = poolTesters[i];
      if (!tester || tester.id === app.owner_id) continue;

      const isApproved = i < Math.floor(testerCount * 0.7); // 70% verified & approved
      await prisma.testParticipation.create({
        data: {
          app_id: createdApp.id,
          user_id: tester.id,
          status: isApproved ? "APPROVED" : "INVITED",
          feedback_type: isApproved ? "NO_PROBLEM" : null,
          feedback_text: isApproved ? "Arayüz çok akıcı, sorunsuz test edildi." : null,
          tester_answer: isApproved ? app.verification_answer : null,
          joined_at: new Date(Date.now() - (testerCount - i) * 86400000),
          claimed_tested_at: isApproved ? new Date(Date.now() - (testerCount - i) * 86400000 + 3600000) : null,
          approved_at: isApproved ? new Date(Date.now() - (testerCount - i) * 86400000 + 3600000) : null,
        },
      });
    }
  }

  // Uur'un mevcut kredi hareketleri (7 Kredi bakiye)
  await prisma.creditTransaction.createMany({
    data: [
      {
        user_id: uur.id,
        amount: 10,
        balance_after: 10,
        transaction_type: "STARTER_CREDIT",
        description: "Sisteme Hoş Geldin Kredisi",
        created_at: new Date(Date.now() - 15 * 86400000),
      },
      {
        user_id: uur.id,
        amount: -10,
        balance_after: 0,
        transaction_type: "APP_PUBLISH",
        description: "Uygulama Yayınlama (Brandlook)",
        created_at: new Date(Date.now() - 10 * 86400000),
      },
      {
        user_id: uur.id,
        amount: 1,
        balance_after: 1,
        transaction_type: "TEST_REWARD",
        description: "Test Doğrulama Ödülü (Durbasma)",
        created_at: new Date(Date.now() - 5 * 86400000),
      },
      {
        user_id: uur.id,
        amount: 1,
        balance_after: 2,
        transaction_type: "TEST_REWARD",
        description: "Test Doğrulama Ödülü (HafifSepet)",
        created_at: new Date(Date.now() - 3 * 86400000),
      },
      {
        user_id: uur.id,
        amount: 5,
        balance_after: 7,
        transaction_type: "ADMIN_ADJUSTMENT",
        description: "Admin Bonus Kredisi",
        created_at: new Date(Date.now() - 1 * 86400000),
      },
    ],
  });

  // Uur'un test katılımı (Durbasma onaylı, HafifSepet onaylı)
  await prisma.testParticipation.create({
    data: {
      app_id: "app-durbasma",
      user_id: uur.id,
      status: "APPROVED",
      feedback_type: "NO_PROBLEM",
      feedback_text: "Oyun çok akıcı, refleks testi başarılı.",
      tester_answer: "Oyuna Başla",
      joined_at: new Date(Date.now() - 6 * 86400000),
      claimed_tested_at: new Date(Date.now() - 5 * 86400000),
      approved_at: new Date(Date.now() - 5 * 86400000),
    },
  });

  await prisma.testParticipation.create({
    data: {
      app_id: "app-hafifsepet",
      user_id: uur.id,
      status: "APPROVED",
      feedback_type: "NO_PROBLEM",
      feedback_text: "Sepet karşılaştırması güzel çalıştı.",
      tester_answer: "0 TL",
      joined_at: new Date(Date.now() - 4 * 86400000),
      claimed_tested_at: new Date(Date.now() - 3 * 86400000),
      approved_at: new Date(Date.now() - 3 * 86400000),
    },
  });

  // Uur için bildirimler
  await prisma.notification.createMany({
    data: [
      {
        user_id: uur.id,
        type: "NEW_TESTER",
        title: "Yeni Testçi Katıldı",
        message: "Brandlook uygulamanıza yeni bir testçi katıldı. Play Console'a ekleyebilirsiniz.",
        link: "/apps/app-brandlook/manage",
        is_read: false,
        created_at: new Date(Date.now() - 2 * 3600000),
      },
      {
        user_id: uur.id,
        type: "TEST_APPROVED",
        title: "Kredi Kazandın! 🪙 +1",
        message: '"Durbasma" testiniz otomatik onaylandı ve 1 kredi hesabınıza aktarıldı.',
        link: "/?tab=profile",
        is_read: true,
        created_at: new Date(Date.now() - 5 * 86400000),
      },
    ],
  });

  console.log("✅ 15 Yeni uygulama ve veritabanı başarıyla temizlendi & dolduruldu!");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
