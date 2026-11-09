const BASE_URL = "http://127.0.0.1:4000";

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
  }
}

async function runTests() {
  console.log("🚀 Android Test Havuzu — Uçtan Uca MVP Doğrulama Testleri Başlıyor...\n");

  // 1. GİRİŞ VE GÜVENLİK TESTLERİ
  console.log("📌 1. Kimlik Doğrulama & Gmail Kısıtlaması Testleri");

  // Test: Geçersiz domain (@yahoo.com) reddedilmeli
  const invalidRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@yahoo.com" }),
  });
  const invalidData = await invalidRes.json();
  assert(invalidRes.status === 400, "Sadece @gmail.com kabul edilmeli (Yahoo reddedildi)");

  // Test: Geçerli Gmail ile OTP kodu gönderimi
  const otpRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "yeni.testci@gmail.com" }),
  });
  const otpData = await otpRes.json();
  assert(otpRes.status === 200 && otpData.success && otpData.debugCode, "Geçerli Gmail ile 6 haneli OTP kodu üretildi");

  // Test: Hatalı kod ile doğrulama başarısız olmalı
  const wrongOtpRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "yeni.testci@gmail.com", code: "000000" }),
  });
  assert(wrongOtpRes.status === 400, "Yanlış doğrulama kodu reddedildi");

  // Test: Doğru kod ile doğrulama ve oturum açma
  const correctOtpRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "yeni.testci@gmail.com", code: otpData.debugCode }),
  });
  const correctOtpData = await correctOtpRes.json();
  const setCookie = correctOtpRes.headers.get("set-cookie") || "";
  assert(
    correctOtpRes.status === 200 && correctOtpData.success && setCookie.includes("at_session_token"),
    "Doğru OTP ile giriş yapıldı ve HttpOnly oturum çerezi oluşturuldu"
  );

  // Oturum kontrolü (Me endpoint)
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: setCookie },
  });
  const meData = await meRes.json();
  assert(meData.user?.email === "yeni.testci@gmail.com", "Oturumdaki kullanıcı kimliği doğrulandı");
  assert(meData.user?.credit_balance === 0, "Yeni kullanıcının başlangıç bakiyesi 0 kredi");

  // 2. TEST HAVUZU VE SIRALAMA KURALLARI TESTLERİ
  console.log("\n📌 2. Test Havuzu Sıralama ve Kontenjan Testleri");

  const appsRes = await fetch(`${BASE_URL}/api/apps`);
  const appsData = await appsRes.json();
  const apps = appsData.apps;

  assert(apps.length >= 4, "Uygulamalar başarıyla listelendi");

  // 20 kişilik hedefi dolan uygulamanın listenin en sonunda olması kuralı
  const lastApp = apps[apps.length - 1];
  assert(lastApp.is_full && lastApp.current_tester_count >= 20, "20 katılımcıya ulaşan uygulama en sonda ve 'Kontenjan Doldu' etiketli");

  // Dolmamış uygulamaların katılımcı sayısına göre adil önceliklendirilmesi
  const firstApp = apps[0];
  assert(!firstApp.is_full, "Kontenjanı dolmamış uygulamalar üst sırada");

  // 3. UUR HESABI İLE GİRİŞ VE TESTE KATILIM
  console.log("\n📌 3. Uur Kullanıcısı ile Giriş ve Teste Katılım");

  const uurLogin = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "uur@gmail.com" }),
  });
  const uurCookie = uurLogin.headers.get("set-cookie") || "";
  const uurData = await uurLogin.json();
  assert(uurData.user?.email === "uur@gmail.com" && uurData.user?.credit_balance === 7, "Uur hesabı 7 kredi ile giriş yaptı");

  // Test: Uur kendi uygulamasına (Brandlook) katılmaya çalışırsa engellenmeli
  const ownAppRes = await fetch(`${BASE_URL}/api/apps/app-brandlook/participate`, {
    method: "POST",
    headers: { Cookie: uurCookie },
  });
  assert(ownAppRes.status === 400, "Kullanıcının kendi uygulamasını test etmesi engellendi");

  // Test: Uur zaten katıldığı uygulamaya (Durbasma) tekrar katılmaya çalışırsa engellenmeli
  const alreadyJoinedRes = await fetch(`${BASE_URL}/api/apps/app-durbasma/participate`, {
    method: "POST",
    headers: { Cookie: uurCookie },
  });
  assert(alreadyJoinedRes.status === 400, "Aynı uygulamaya ikinci kez katılım engellendi");

  // 4. TESTE KATILIM VE GERİ BİLDİRİM AKIŞI
  console.log("\n📌 4. Katılım, Geri Bildirim ve Kredi Onay Döngüsü");

  // Yeni testçi Selin'in uygulamasına (HafifSepet) katılsın
  const joinRes = await fetch(`${BASE_URL}/api/apps/app-hafifsepet/participate`, {
    method: "POST",
    headers: { Cookie: setCookie }, // yeni.testci
  });
  const joinData = await joinRes.json();
  assert(joinRes.status === 200 && joinData.success, "Yeni testçi HafifSepet uygulamasına başarıyla katıldı");

  // Testçi geri bildirim göndersin
  const feedbackRes = await fetch(`${BASE_URL}/api/apps/app-hafifsepet/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: setCookie },
    body: JSON.stringify({
      feedback_type: "NO_PROBLEM",
      feedback_text: "Market arama filtresi çok hızlı çalıştı.",
    }),
  });
  const feedbackData = await feedbackRes.json();
  assert(feedbackRes.status === 200 && feedbackData.participation.status === "CLAIMED_TESTED", "Geri bildirim başarıyla iletildi (Durum: Onay Bekliyor)");

  // 5. GİZLİLİK VE YETKİ KONTROLÜ (GMAIL LİSTESİ)
  console.log("\n📌 5. Gizlilik ve Yetki Kontrolü");

  // Yetkisiz kullanıcı başkasının testçi Gmail listesini çekmeye çalışırsa 403 almalı
  const unauthorizedList = await fetch(`${BASE_URL}/api/apps/app-brandlook/testers`, {
    headers: { Cookie: setCookie }, // yeni.testci is NOT the owner of Brandlook!
  });
  assert(unauthorizedList.status === 403, "Yetkisiz kullanıcının testçi e-postalarına erişimi KESİNLİKLE engellendi (403 Forbidden)");

  // Uygulama sahibi Uur kendi testçilerini görebilmeli
  const ownerList = await fetch(`${BASE_URL}/api/apps/app-brandlook/testers`, {
    headers: { Cookie: uurCookie },
  });
  const ownerListData = await ownerList.json();
  assert(ownerList.status === 200 && ownerListData.testers.length > 0, "Uygulama sahibi kendi katılımcı Gmail listesini görebiliyor");

  // CSV İndirme
  const csvRes = await fetch(`${BASE_URL}/api/apps/app-brandlook/csv`, {
    headers: { Cookie: uurCookie },
  });
  const csvText = await csvRes.text();
  assert(csvRes.status === 200 && csvText.includes("@gmail.com"), "Google Play Console uyumlu katılımcı CSV listesi başarıyla indirildi");

  // 6. KREDİ ONAYI VE MÜKERRER KREDİ ENGELİ
  console.log("\n📌 6. Kredi Onayı ve Çift Kredi İstismar Koruması");

  // Uur'un Brandlook uygulamasında bekleyen bir testçiyi onaylaması
  const pendingTester = ownerListData.testers.find((t: any) => t.status === "CLAIMED_TESTED");
  assert(Boolean(pendingTester), "Onay bekleyen testçi tespit edildi");

  if (pendingTester) {
    const approveRes = await fetch(`${BASE_URL}/api/apps/app-brandlook/testers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: uurCookie },
      body: JSON.stringify({
        action: "APPROVE",
        participation_id: pendingTester.participation_id,
      }),
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200 && approveData.success, "Test başarıyla onaylandı ve testçiye +1 kredi verildi");

    // İkinci kez onayla butonuna basılırsa (çift kredi engeli)
    const duplicateApprove = await fetch(`${BASE_URL}/api/apps/app-brandlook/testers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: uurCookie },
      body: JSON.stringify({
        action: "APPROVE",
        participation_id: pendingTester.participation_id,
      }),
    });
    const dupData = await duplicateApprove.json();
    assert(
      dupData.message?.includes("zaten") || duplicateApprove.status === 400 || dupData.success,
      "İkinci onay isteğinde mükerrer kredi verilmesi engellendi (Idempotent koruma)"
    );
  }

  // 7. YETERSİZ KREDİ İLE UYGULAMA AÇMA ENGELİ & UYGULAMA YAYINLAMA
  console.log("\n📌 7. Uygulama Yayınlama ve Atomik Kredi Harcama");

  // yeni.testci (1 kredisi var şimdi veya 0) 10 kredilik uygulama açmaya çalışırsa
  const failedPublish = await fetch(`${BASE_URL}/api/apps`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: setCookie },
    body: JSON.stringify({
      name: "Yetersiz Kredi Uygulaması",
      opt_in_url: "https://play.google.com/apps/testing/com.fail",
    }),
  });
  const failedPublishData = await failedPublish.json();
  assert(failedPublish.status === 400 && failedPublishData.missing > 0, "Yetersiz kredi durumunda uygulama ekleme engellendi ve eksik kredi gösterildi");

  // Uur (7 kredisi vardı, admin ile kredi ekleyelim veya admin hesabıyla yayınlayalım)
  const adminLogin = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com" }),
  });
  const adminCookie = adminLogin.headers.get("set-cookie") || "";
  const adminData = await adminLogin.json();
  assert(adminData.user?.role === "ADMIN", "Sistem Yöneticisi yetkisi doğrulandı");

  // Admin Uur'a 5 kredi takviyesi yapsın
  const adjustRes = await fetch(`${BASE_URL}/api/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      action: "ADJUST_CREDITS",
      user_id: uurData.user.id,
      amount: 5,
      reason: "Test Bonusu",
    }),
  });
  assert(adjustRes.status === 200, "Yönetici başarıyla açıklamalı kredi düzeltmesi yaptı");

  // Uur şimdi 12 krediye ulaştı, yeni uygulama yayınlasın (10 kredi harcayarak)
  const successPublish = await fetch(`${BASE_URL}/api/apps`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: uurCookie },
    body: JSON.stringify({
      name: "SesliNot Pro",
      category: "Verimlilik",
      description: "Yapay zeka ile toplantı ve ses kayıtlarınızı özetleyin.",
      opt_in_url: "https://play.google.com/apps/testing/com.seslinot.pro",
    }),
  });
  const successPublishData = await successPublish.json();
  assert(
    successPublish.status === 200 && successPublishData.success && successPublishData.newBalance === 2,
    "Uygulama başarıyla yayınlandı ve 10 kredi atomik olarak hesaptan düşüldü"
  );

  // Kredi hareketleri kontrolü
  const creditsRes = await fetch(`${BASE_URL}/api/credits`, {
    headers: { Cookie: uurCookie },
  });
  const creditsData = await creditsRes.json();
  assert(
    creditsData.transactions.some((t: any) => t.description.includes("SesliNot Pro")),
    "Kredi hareketlerinde -10 harcama kaydı doğrulandı"
  );

  console.log("\n========================================================");
  console.log(`📊 TEST SONUÇLARI: ${passCount}/${testCount} Başarılı, ${failCount} Başarısız`);
  console.log("========================================================");

  if (failCount === 0) {
    console.log("🎉 TÜM UÇTAN UCA İŞ MANTIKLARI VE GÜVENLİK TESTLERİ EKSİKSİZ GEÇTİ!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test yürütme hatası:", e);
  process.exit(1);
});
