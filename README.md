# ⚽ خماسي الملوك — دليل الربط والرفع

## الخطوة 1: إنشاء مشروع Firebase

1. روح على https://console.firebase.google.com
2. اضغط **"Add project"** → اكتب اسم زي `khamasi-app`
3. امسح Google Analytics (مش محتاجها) → اضغط **Create project**

---

## الخطوة 2: إنشاء Firestore Database

1. من القائمة الجانبية: **Build → Firestore Database**
2. اضغط **Create database**
3. اختار **"Start in test mode"** (مؤقتاً للتطوير)
4. اختار أقرب region: `europe-west1` أو `us-central1`
5. اضغط **Enable**

---

## الخطوة 3: الحصول على بيانات الربط

1. اضغط على أيقونة **⚙️ Project Settings** (الترس)
2. نزل لأسفل → **Your apps** → اضغط **</>** (Web)
3. اكتب اسم للـ app → اضغط **Register app**
4. هتلاقي كود زي ده:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "khamasi-app.firebaseapp.com",
  projectId: "khamasi-app",
  storageBucket: "khamasi-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## الخطوة 4: تعديل firebase-config.js

افتح ملف `firebase-config.js` وضع بياناتك:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",          // ← هنا
  authDomain:        "khamasi-app...",     // ← هنا
  projectId:         "khamasi-app",        // ← هنا
  storageBucket:     "khamasi-app...",     // ← هنا
  messagingSenderId: "123456789",          // ← هنا
  appId:             "1:123...:web:abc"    // ← هنا
};
```

---

## الخطوة 5: رفع على Netlify

### الطريقة السهلة (Drag & Drop):
1. روح https://app.netlify.com
2. سجل دخول (مجاناً بـ GitHub أو Email)
3. اسحب مجلد المشروع كله وضعه في المنطقة المكتوب فيها **"drag and drop"**
4. خلاص! هتاخد رابط فوراً 🎉

### أو عن طريق GitHub:
1. ارفع الملفات على GitHub repo
2. في Netlify: **"Import from Git"** → اختار الـ repo
3. Deploy ✅

---

## هيكل الملفات

```
📁 مشروعك/
 ├── index.html          ← صفحة الفرق
 ├── players.html        ← إدارة اللاعبين
 ├── style.css           ← الـ CSS
 ├── firebase-config.js  ← ← ← ضع بياناتك هنا
 ├── app.js              ← منطق صفحة الفرق
 ├── players.js          ← منطق صفحة اللاعبين
 └── README.md           ← الدليل ده
```

---

## ⚠️ تأمين الداتابيز (مهم قبل النشر)

بعد ما تتأكد إن كل شيء شغال، غير Rules في Firestore من:

```js
// ❌ مفتوح للكل (مؤقت فقط)
allow read, write: if true;
```

إلى:

```js
// ✅ قراءة للكل، كتابة للكل (مناسب لمشروعك الصغير)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{document=**} {
      allow read, write: if true;
    }
  }
}
```

للتغيير: **Firestore → Rules → Edit → Publish**

---

## مميزات الموقع

- ✅ إضافة لاعبين مع تقييم 1-5 نجوم
- ✅ تعديل اسم أو قوة أي لاعب في أي وقت
- ✅ حذف لاعبين
- ✅ اختيار من 4-10 لاعبين للمباراة
- ✅ توزيع فرق عادل ومتوازن تلقائياً
- ✅ زر "خلط تاني" للتوزيع مجدداً
- ✅ مقياس التوازن بين الفريقين
- ✅ بحث عن لاعبين
- ✅ تحديث فوري من الداتابيز (realtime)
