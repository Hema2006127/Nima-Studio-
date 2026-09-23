# نشر الموقع على الدومين (Netlify)

الموقع جاهز للنشر على **Netlify**. Netlify بيتعرف على Next.js أوتوماتيك، والإعدادات موجودة في `netlify.toml`.
> الاستضافة العادية (Shared hosting / cPanel من غير Node.js) **مش هتشغّل الموقع**، لأنه محتاج سيرفر Node.js.

---

## 1) رفع الموقع على Netlify

1. ادخل [app.netlify.com](https://app.netlify.com) وسجّل بحساب GitHub.
2. **Add new project → Import an existing project → GitHub**، واختار الريبو `Nima-Studio-`.
   (لو الريبو مش ظاهر، دوس **Configure Netlify on GitHub** واديله صلاحية على الريبو.)
3. في صفحة الإعدادات:
   - **Branch to deploy**: `main`
   - **Build command** و **Publish directory**: سيبهم زي ما Netlify يحددهم (بياخدهم من `netlify.toml`).
4. قبل ما تدوس Deploy، دوس **Add environment variables** وضيف التلاتة دول:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://ucrhawxncltovtfuilue.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | الـ publishable key (`sb_publishable_...`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` ← الدومين بتاعك بالظبط |

   ⚠️ متضيفش الـ secret key أبداً.
   (لو نسيتهم: **Site configuration → Environment variables**، وبعدها **Deploys → Trigger deploy → Deploy site**.)
5. دوس **Deploy**. بعد 2–4 دقايق هيديك لينك تجريبي زي `nima-studio.netlify.app`. جرّب عليه الموقع قبل ما تربط الدومين.

## 2) ربط الدومين

1. في المشروع على Netlify: **Domain management → Add a domain**، واكتب الدومين (مثلاً `nimastudio.com`) ودوس **Verify** ثم **Add domain**. Netlify بيضيف `www` معاه أوتوماتيك.
2. عندك طريقتين:

   **أ) الأسهل — Netlify DNS:** Netlify هيديك 4 **Nameservers** (زي `dns1.p01.nsone.net`). ادخل لوحة الشركة اللي اشتريت منها الدومين (GoDaddy / Namecheap / Hostinger …) وغيّر الـ Nameservers للأربعة دول.

   **ب) تفضل على DNS الشركة بتاعتك:** ضيف السجلين دول في إعدادات DNS:
   | Type | Host | Value |
   |---|---|---|
   | `A` | `@` | `75.2.60.5` |
   | `CNAME` | `www` | `your-site.netlify.app` ← اللينك التجريبي بتاعك من غير https |

   (لو الشركة بتدعم `ALIAS` أو `ANAME`، استخدمه بدل الـ A record وخلّي قيمته `apex-loadbalancer.netlify.com`.)
3. استنى لحد ما الـ DNS يشتغل (من دقايق لـ 24 ساعة). بعدها Netlify بيعمل شهادة **HTTPS** أوتوماتيك، ولو متعملتش افتح **Domain management → HTTPS → Verify DNS configuration**.
4. لو غيّرت `NEXT_PUBLIC_SITE_URL` بعد أول نشر، اعمل **Trigger deploy** عشان التغيير يتطبق.

> **صور الغلاف:** أقصى حجم 4 MB (حد Netlify لرفع الملفات). صغّر الصور قبل الرفع لو أكبر، مثلاً بـ [squoosh.app](https://squoosh.app).

## 3) إعدادات Supabase للدومين (مهمة جداً)

من مشروعك على Supabase:

1. **Authentication → URL Configuration**
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs** ضيف:
     - `https://your-domain.com/auth/callback`
     - `https://www.your-domain.com/auth/callback`
     - `http://localhost:3000/auth/callback` (عشان التجربة على جهازك)
2. **Authentication → Sign In / Providers → Email**: خلي **Confirm email** شغال.
3. **إيميلات التفعيل — لازم SMTP خاص** ⚠️
   خدمة الإيميل الافتراضية في Supabase بتبعت بس لإيميلات أعضاء فريق المشروع، وبعدد قليل جداً في الساعة، يعني **العملاء مش هيوصلهم إيميل التفعيل**.
   - اعمل حساب مجاني على [resend.com](https://resend.com) (أو أي خدمة SMTP)، واربطه بالدومين بتاعك، وخد بيانات SMTP.
   - في Supabase: **Project Settings → Authentication → SMTP Settings** → فعّل **Custom SMTP** وحط البيانات، والـ Sender email يكون من الدومين (مثلاً `hello@your-domain.com`).
4. (اختياري) **Authentication → Emails → Templates**: عدّل نص إيميل التفعيل واسترجاع كلمة السر بالعربي وباسم الاستوديو.

## 4) قبل ما تعلن عن الموقع

- [ ] من `/admin/site` غيّر **Studio name** (لسه مكتوب "Studio Name") والـ tagline والنصوص، بالعربي والإنجليزي.
- [ ] ضيف أرقام التليفون والواتساب والإيميل.
- [ ] من `/admin/services` راجع الخدمات والأسعار.
- [ ] من `/admin/portfolio` ضيف أفلامك واعملها Publish.
- [ ] جرّب بإيميل حقيقي: حساب جديد ← يوصلك إيميل التفعيل ← ابعت حجز ← ابعت عرض سعر من الأدمن ← شوفه من حساب العميل.
- [ ] جرّب "نسيت كلمة السر".
- [ ] (اختياري) غيّر أيقونة التاب: استبدل `src/app/favicon.ico` بلوجو الاستوديو.

## التحديثات بعد كده

أي تعديل يترفع على GitHub (`main`) بيتنشر على Netlify أوتوماتيك خلال دقايق.
لو فيه تعديل على قاعدة البيانات (ملف جديد في `supabase/migrations`) لازم يتشغّل في Supabase SQL Editor الأول.
