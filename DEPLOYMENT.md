# نشر الموقع على الدومين

الطريقة المقترحة: **Vercel** (مجاني، ومصمم لـ Next.js) + ربط الدومين بتاعك.
> الاستضافة العادية (Shared hosting / cPanel من غير Node.js) **مش هتشغّل الموقع**، لأنه محتاج سيرفر Node.js.

---

## 1) رفع الموقع على Vercel

1. ادخل [vercel.com](https://vercel.com) وسجّل بحساب GitHub.
2. **Add New → Project** واختار الريبو `Nima-Studio-` ودوس **Import**.
3. قبل ما تدوس Deploy، افتح **Environment Variables** وضيف التلاتة دول:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://ucrhawxncltovtfuilue.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | الـ publishable key (`sb_publishable_...`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` ← الدومين بتاعك بالظبط |

   ⚠️ متضيفش الـ secret key أبداً.
4. دوس **Deploy**، وبعد دقيقتين هيديك لينك تجريبي زي `nima-studio.vercel.app`.

## 2) ربط الدومين

1. في المشروع على Vercel: **Settings → Domains** واكتب الدومين (مثلاً `nimastudio.com`) ودوس **Add**. ضيف كمان `www.nimastudio.com`.
2. Vercel هيوريك سجلات DNS المطلوبة. ادخل لوحة التحكم بتاعة الشركة اللي اشتريت منها الدومين (GoDaddy / Namecheap / Hostinger …) وفي **DNS** ضيف اللي Vercel طالبه، وغالباً بيبقى:
   - `A` record → Host: `@` → Value: القيمة اللي Vercel بيديهالك (عادة `76.76.21.21`)
   - `CNAME` record → Host: `www` → Value: `cname.vercel-dns.com`
3. استنى من دقايق لكام ساعة لحد ما الـ DNS يشتغل. شهادة HTTPS بتتعمل أوتوماتيك.
4. لو غيّرت `NEXT_PUBLIC_SITE_URL` بعد أول Deploy، اعمل **Redeploy** من تبويب Deployments.

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

أي تعديل يترفع على GitHub (`main`) بيتنشر على الموقع أوتوماتيك خلال دقيقتين.
لو فيه تعديل على قاعدة البيانات (ملف جديد في `supabase/migrations`) لازم يتشغّل في Supabase SQL Editor الأول.
