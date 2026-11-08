#!/usr/bin/env node
/**
 * ROYAL RP - seed data
 * ---------------------------------------------------------------
 * Loads the starter catalogue, staff list, gallery and news so a
 * fresh install has a working store immediately.
 *
 *   npm run db:seed
 *
 * It is idempotent: running it twice will not duplicate rows.
 * The demo accounts it creates are marked clearly and should be
 * removed before going live (the script prints a reminder).
 * ---------------------------------------------------------------
 */
import { db } from './db.js';
import { hashPassword } from '../utils/index.js';

const CATEGORIES = [
  ['vip',       'vip',       'VIP Memberships',  'اشتراک VIP',          'crown',  1],
  ['vehicles',  'vehicles',  'Vehicles',         'خودروها',             'car',    2],
  ['money',     'money',     'Cash Packages',    'بسته‌های پول',        'money',  3],
  ['character', 'character', 'Character',        'شخصیت',               'user',   4],
  ['clothing',  'clothing',  'Custom Clothing',  'پوشاک اختصاصی',       'tag',    5],
  ['mlo',       'mlo',       'Custom MLO',       'اینتریر MLO',         'box',    6],
  ['gang',      'gang',      'Gang Packages',    'پکیج گنگ',            'shield', 7],
  ['business',  'business',  'Business',         'کسب‌وکار',            'map',    8],
  ['property',  'property',  'Property',         'املاک',               'home2',  9],
  ['services',  'services',  'Special Services', 'خدمات ویژه',          'star',  10],
  ['donation',  'donation',  'Donations',        'حمایت مالی',          'gift',  11]
];

/* [id, category, name, nameFa, price, oldPrice, image, short, features,
    stock, maxPerOrder, duration, badge, featured, popular,
    deliveryType, deliveryPayload, deliveryNote] */
const AUTO = 'پس از تأیید پرداخت، حداکثر تا ۶۰ ثانیه به‌صورت خودکار داخل بازی تحویل می‌شود.';
const MANUAL = 'تحویل دستی: تیم ما حداکثر تا ۴۸ ساعت در دیسکورد با شما تماس می‌گیرد.';

const PRODUCTS = [
  ['vip-bronze', 'vip', 'VIP Bronze', 'وی‌آی‌پی برنز', 99000, null, 'assets/images/products/vip-bronze.svg',
   'نخستین گام شما به حلقه رویال. سی روز دسترسی اولویت‌دار همراه با حقوق ماهانه.',
   ['جایگاه اولویت‌دار در صف ورود', 'حقوق ماهانه ۱۵۰٬۰۰۰ دلار', 'رول برنز در دیسکورد', 'دو اسلات شخصیت اضافی', 'کانال گفتگوی مخصوص وی‌آی‌پی'],
   null, 5, '۳۰ روز', null, 0, 0, 'vip', { tier: 'bronze', days: 30, stipend: 150000 }, AUTO],

  ['vip-silver', 'vip', 'VIP Silver', 'وی‌آی‌پی نقره‌ای', 189000, 249000, 'assets/images/products/vip-silver.svg',
   'انتخاب هوشمندانه. هر چه در برنز هست، به‌همراه یک جای پارک، پلاک اختصاصی و صف سریع‌تر.',
   ['همه امکانات برنز', 'حقوق ماهانه ۴۰۰٬۰۰۰ دلار', 'یک جای پارک اضافی در گاراژ', 'یک پلاک اختصاصی', 'رول نقره‌ای در دیسکورد', 'اولویت در صف پشتیبانی'],
   null, 5, '۳۰ روز', 'محبوب', 1, 1, 'vip', { tier: 'silver', days: 30, stipend: 400000 }, AUTO],

  ['vip-gold', 'vip', 'VIP Gold', 'وی‌آی‌پی طلایی', 349000, null, 'assets/images/products/vip-gold.svg',
   'تجربه کامل رویال: یک خودروی اختصاصی، تخفیف خرید ملک و واریز ماهانه نقدی.',
   ['همه امکانات نقره‌ای', 'حقوق ماهانه ۱٬۰۰۰٬۰۰۰ دلار', 'یک خودروی اختصاصی به انتخاب شما', 'بیست درصد تخفیف روی تمام املاک', 'رول طلایی دیسکورد به‌همراه رنگ اختصاصی نام', 'ورود فوری و بدون صف', 'ورود به ایونت ماهانه'],
   null, 5, '۳۰ روز', 'به‌صرفه‌ترین', 1, 0, 'vip', { tier: 'gold', days: 30, stipend: 1000000 }, AUTO],

  ['vip-platinum', 'vip', 'VIP Platinum', 'وی‌آی‌پی پلاتین', 690000, null, 'assets/images/products/vip-platinum.svg',
   'بالاترین سطح. مزایای ماندگار، اینتریر MLO اختصاصی و خط ارتباطی مستقیم با تیم مدیریت.',
   ['همه امکانات طلایی', 'حقوق ماهانه ۲٬۵۰۰٬۰۰۰ دلار', 'یک اینتریر MLO اختصاصی', 'چهار خودروی اختصاصی', 'رول پلاتین در دیسکورد', 'کانال ارتباط مستقیم با مدیریت', 'دسترسی زودهنگام به محتوای جدید', 'ثبت نام شما در دیوار حامیان'],
   null, 3, '۳۰ روز', 'نهایت', 0, 0, 'vip', { tier: 'platinum', days: 30, stipend: 2500000 }, AUTO],

  ['exclusive-supercar', 'vehicles', 'Exclusive Supercar', 'سوپراسپورت اختصاصی', 299000, null, 'assets/images/products/vehicle-exclusive.svg',
   'یک سوپراسپورت دست‌چین‌شده که برای همیشه با سوییچ به گاراژ شما اضافه می‌شود.',
   ['ثبت دائمی در گاراژ', 'تیون کامل باز شده', 'رنگ سفارشی به درخواست شما', 'بیمه خودرو'],
   24, 2, null, null, 1, 0, 'vehicle', { model: 'zentorno', tuning: 'full' }, AUTO],

  ['custom-vehicle-build', 'vehicles', 'Custom Vehicle Build', 'ساخت خودروی سفارشی', 549000, null, 'assets/images/products/vehicle-custom.svg',
   'نمونه مورد نظرتان را بفرستید؛ توسعه‌دهندگان ما خودرو را می‌سازند و روی سرور استریم می‌کنند.',
   ['ساخت مدل مطابق نمونه شما', 'تنظیم هندلینگ توسط توسعه‌دهندگان ما', 'یکتا در کل سرور', 'تا ده روز کاری'],
   5, 1, null, 'محدود', 0, 0, 'manual', null, MANUAL],

  ['cash-500k', 'money', '$500,000 Cash', '۵۰۰ هزار دلار', 59000, null, 'assets/images/products/money-pack.svg',
   'نیم میلیون دلار پاک، مستقیم به حساب بانکی شخصیت شما.',
   ['واریز فوری به حساب بانکی', 'بدون خطر پاک شدن', 'قابل استفاده روی هر شخصیت'],
   null, 10, null, null, 0, 0, 'money', { amount: 500000, account: 'bank' }, AUTO],

  ['cash-2m', 'money', '$2,000,000 Cash', '۲ میلیون دلار', 199000, 249000, 'assets/images/products/money-pack.svg',
   'کافی برای خرید یک کسب‌وکار، یک پنت‌هاوس و پر کردن گاراژ.',
   ['واریز فوری به حساب بانکی', 'بهترین نسبت ارزش به قیمت', 'قابل جمع شدن با حقوق وی‌آی‌پی'],
   null, 10, null, null, 0, 1, 'money', { amount: 2000000, account: 'bank' }, AUTO],

  ['cash-10m', 'money', '$10,000,000 Cash', '۱۰ میلیون دلار', 749000, null, 'assets/images/products/money-pack.svg',
   'سرمایه‌ای در سطح بنیان‌گذاران، برای بازیکنی که امپراتوری می‌سازد.',
   ['واریز فوری به حساب بانکی', 'ثبت‌شده به‌عنوان درآمد قانونی', 'تحویل با اولویت'],
   null, 3, null, 'ویژه', 0, 0, 'money', { amount: 10000000, account: 'bank' }, AUTO],

  ['extra-character-slot', 'character', 'Extra Character Slot', 'اسلات شخصیت اضافی', 89000, null, 'assets/images/products/character-slot.svg',
   'یک زندگی دیگر برای تجربه کردن. دائمی و مخصوص حساب شما.',
   ['دائمی', 'تا هشت شخصیت قابل افزایش', 'اعمال فوری'],
   null, 4, null, null, 0, 0, 'slot', { count: 1 }, AUTO],

  ['character-name-change', 'character', 'Character Name Change', 'تغییر نام شخصیت', 55000, null, 'assets/images/products/name-change.svg',
   'هویت شخصیت خود را از نو بنویسید. نام انتخابی توسط تیم مدیریت بررسی می‌شود.',
   ['نام و نام خانوادگی کامل', 'تمام دارایی‌ها و پول حفظ می‌شود', 'بررسی حداکثر تا ۲۴ ساعت'],
   null, 2, null, null, 0, 0, 'manual', null,
   'تحویل دستی: نام درخواستی پیش از اعمال توسط تیم مدیریت بررسی می‌شود.'],

  ['custom-licence-plate', 'character', 'Custom Licence Plate', 'پلاک اختصاصی', 75000, null, 'assets/images/products/plate-custom.svg',
   'تا هشت کاراکتر دلخواه روی هر خودرویی که مالک آن هستید.',
   ['حداکثر هشت کاراکتر', 'قابل انتقال بین خودروهای شما', 'پالایش واژه‌های نامناسب'],
   null, 5, null, null, 0, 0, 'manual', null, MANUAL],

  ['designer-clothing-pack', 'clothing', 'Designer Clothing Pack', 'پکیج پوشاک طراحی', 125000, null, 'assets/images/products/clothing-pack.svg',
   'بیش از چهل لباس اختصاصی که تنها برای حامیان سرور استریم می‌شود.',
   ['بیش از چهل آیتم', 'نسخه مردانه و زنانه', 'آیتم‌های تازه در هر فصل'],
   null, 3, null, null, 0, 1, 'item', { item: 'clothing_pack_s4', count: 1 }, AUTO],

  ['custom-outfit-commission', 'clothing', 'Custom Outfit Commission', 'سفارش لباس اختصاصی', 329000, null, 'assets/images/products/clothing-pack.svg',
   'طراح ما بر اساس تصاویر مرجع شما یک دست لباس یکتا طراحی می‌کند.',
   ['کاملاً سفارشی', 'دو مرحله اصلاح', 'اختصاصی و فقط برای شما'],
   8, 1, null, null, 0, 0, 'manual', null, MANUAL],

  ['custom-mlo-interior', 'mlo', 'Custom MLO Interior', 'اینتریر MLO اختصاصی', 950000, null, 'assets/images/products/mlo-pack.svg',
   'یک اینتریر سفارشی که برای کسب‌وکار یا خانه شما ساخته و استریم می‌شود.',
   ['طراحی با مشورت خودتان', 'چیدمان مبلمان و نورپردازی', 'مالکیت اینتریر به‌صورت اسکریپتی', 'تا سه هفته'],
   3, 1, null, 'پرمیوم', 0, 0, 'manual', null,
   'تحویل دستی: پس از تأیید پرداخت، یکی از توسعه‌دهندگان برای جلسه طراحی با شما هماهنگ می‌کند.'],

  ['gang-starter-package', 'gang', 'Gang Starter Package', 'پکیج شروع گنگ', 479000, null, 'assets/images/products/gang-pack.svg',
   'ثبت رسمی گنگ: انبار مشترک، ثبت منطقه نفوذ و گاراژ اختصاصی گنگ.',
   ['تا پانزده عضو', 'انبار مشترک با ۱۲۰ اسلات', 'ثبت یک منطقه نفوذ', 'گاراژ گنگ برای شش خودرو', 'رنگ‌های اختصاصی گنگ'],
   12, 1, null, null, 0, 0, 'manual', null,
   'نیازمند بررسی مدیریت: نام گنگ و منطقه نفوذ پیش از فعال‌سازی تأیید می‌شود.'],

  ['gang-headquarters', 'gang', 'Gang Headquarters', 'مقر گنگ', 1090000, null, 'assets/images/products/gang-pack.svg',
   'یک مقر کامل با انبار، زرادخانه و اتاق برنامه‌ریزی.',
   ['اینتریر MLO خصوصی', 'کنترل دسترسی به زرادخانه', 'انبار با ۳۰۰ اسلات', 'سطح دسترسی بر اساس رنک اعضا'],
   4, 1, null, 'محدود', 0, 0, 'manual', null, MANUAL],

  ['small-business-licence', 'business', 'Small Business Licence', 'جواز کسب‌وکار کوچک', 419000, null, 'assets/images/products/business-pack.svg',
   'مالک یک مغازه شوید، کارمند استخدام کنید و درآمد قانونی بسازید.',
   ['ثبت رسمی مالکیت کسب‌وکار', 'استخدام تا پنج کارمند', 'سیستم صندوق و موجودی انبار', 'تسویه هفتگی درآمد'],
   15, 1, null, null, 0, 0, 'manual', null, MANUAL],

  ['premium-business', 'business', 'Premium Business', 'کسب‌وکار پرمیوم', 1450000, null, 'assets/images/products/business-pack.svg',
   'یک کلاب شبانه، تعمیرگاه یا رستوران با اینتریر اختصاصی و سیستم کامل کارمندان.',
   ['موقعیت ویژه و شاخص', 'اینتریر اختصاصی', 'تا بیست کارمند', 'تبلیغات و معرفی داخل سرور'],
   2, 1, null, 'شاخص', 1, 0, 'manual', null, MANUAL],

  ['luxury-apartment', 'property', 'Luxury Apartment', 'آپارتمان لوکس', 279000, null, 'assets/images/products/property-pack.svg',
   'یک آپارتمان در برج، همراه با انبار، کمد لباس و گاراژ دو خودرو.',
   ['انبار با ۲۰۰ اسلات', 'کمد لباس', 'گاراژ دو خودرو', 'سیستم کلید برای مهمان‌ها'],
   30, 1, null, null, 0, 1, 'manual', null, MANUAL],

  ['vinewood-villa', 'property', 'Vinewood Villa', 'ویلای واین‌وود', 899000, null, 'assets/images/products/property-pack.svg',
   'زندگی روی تپه‌های شهر با استخر، گاراژ شش خودرو و نمای کامل لس‌سانتوس.',
   ['انبار با ۵۰۰ اسلات', 'گاراژ شش خودرو', 'استخر خصوصی', 'میزبانی تا شانزده مهمان'],
   6, 1, null, 'کمیاب', 0, 0, 'manual', null, MANUAL],

  ['priority-queue-30d', 'services', 'Priority Queue (30 days)', 'صف اولویت‌دار (۳۰ روز)', 109000, null, 'assets/images/products/special-service.svg',
   'یک ماه ورود بدون انتظار در ساعات شلوغ سرور.',
   ['ابتدای صف ورود', 'قابل جمع شدن با وی‌آی‌پی', '۳۰ روز'],
   null, 3, '۳۰ روز', null, 0, 0, 'vip', { tier: 'queue', days: 30 }, AUTO],

  ['support-the-server-5', 'donation', 'Support the Server', 'حمایت از سرور', 50000, null, 'assets/images/products/donation.svg',
   'بدون امتیاز، بدون برتری در بازی؛ فقط کمک به پایدار ماندن سرور. سپاسگزاریم.',
   ['رول حامی در دیسکورد', 'ثبت نام شما در دیوار تقدیر', 'سپاس صمیمانه ما'],
   null, 20, null, null, 0, 0, 'role', { role: 'supporter' }, AUTO]
];

/* Staff list. Left empty on purpose: add the real team from the admin
   panel (مدیریت محتوا -> تیم مدیریت), so nobody ships an about page
   full of placeholder names. */
const STAFF = [];


const GALLERY = [
  ['assets/images/backgrounds/hero-city.svg', 'Los Santos at dusk', 'لس سانتوس در غروب', 'city', 'wide'],
  ['assets/images/gta/downtown.svg', 'Downtown skyline', 'نمای مرکز شهر', 'city', null],
  ['assets/images/vehicles/supercar-gold.svg', 'The gold supercar', 'سوپراسپورت طلایی', 'vehicles', null],
  ['assets/images/gta/police-hq.svg', 'Mission Row PD', 'کلانتری میشن رو', 'police', null],
  ['assets/images/characters/police-officer.svg', 'On patrol', 'در حال گشت', 'police', 'tall'],
  ['assets/images/gta/beach.svg', 'Vespucci Beach', 'ساحل وسپوچی', 'city', null],
  ['assets/images/vehicles/police-cruiser.svg', 'LSPD cruiser', 'خودروی پلیس', 'vehicles', null],
  ['assets/images/gta/nightclub.svg', 'Night shift at the club', 'شب در کلاب', 'nightlife', 'wide'],
  ['assets/images/characters/ems-medic.svg', 'Pillbox paramedic', 'پرستار اورژانس', 'ems', null],
  ['assets/images/gta/racing.svg', 'Midnight run', 'مسابقه نیمه‌شب', 'racing', null],
  ['assets/images/gta/casino.svg', 'The Diamond floor', 'سالن کازینو', 'nightlife', null],
  ['assets/images/gta/apartments.svg', 'High-rise living', 'زندگی برجی', 'property', null],
  ['assets/images/characters/gang-member.svg', 'South side crew', 'گروه جنوب شهر', 'gangs', null],
  ['assets/images/vehicles/motorcycle.svg', 'Two wheels', 'دوچرخه موتوری', 'vehicles', null],
  ['assets/images/characters/mechanic.svg', 'Night crew at the garage', 'تیم شب تعمیرگاه', 'jobs', null],
  ['assets/images/vehicles/ambulance.svg', 'Code 3 response', 'پاسخ اضطراری', 'ems', null]
];

const NEWS = [
  ['season-four-los-santos-reborn', 'Season Four: Los Santos Reborn', 'فصل چهارم: تولدی دوباره لس سانتوس',
   'A rebuilt economy, 14 new interiors and a housing market that finally behaves like one.',
   'اقتصاد بازسازی‌شده، ۱۴ اینتریر جدید و بازار مسکنی که بالاخره منطقی عمل می‌کند.',
   `<p>فصل چهارم بزرگ‌ترین تغییر ساختاری است که تا امروز منتشر کرده‌ایم. خلاصه‌اش یک جمله است: پول دوباره معنا پیدا کرد.</p>
    <h2>بازسازی اقتصاد</h2>
    <p>هر شغل قانونی حول یک درآمد ساعتی هدف متعادل‌سازی شده و هر مسیر غیرقانونی حالا ضریب ریسکی دارد که با بالا رفتن حساسیت پلیس بیشتر می‌شود. درآمد در سطوح بالا کمتر و در سطوح پایین به‌طور محسوسی بیشتر شده است.</p>
    <ul><li>مشاغل قانونی: به‌طور میانگین ۲۲٪ افزایش حقوق شروع</li><li>جرائم سنگین: ۳۵٪ کاهش درآمد خام و افزوده شدن ضریب حساسیت</li><li>درآمد کسب‌وکارها حالا به رفت‌وآمد واقعی مشتری بستگی دارد</li></ul>
    <h2>چهارده اینتریر تازه</h2>
    <p>کلانتری میشن‌رو یک انبار مدارک فعال دارد، بیمارستان پیل‌باکس بخش تروای دوم گرفته و نُه موقعیت تجاری که قبلاً فقط دکور بودند، حالا فضاهایی قابل ورود با مالکیت واقعی هستند.</p>
    <h2>بازار مسکنی که مثل بازار رفتار می‌کند</h2>
    <p>ارزش املاک حالا شناور است و بر اساس تقاضای هر منطقه بالا و پایین می‌رود.</p>`,
   'update', 'assets/images/gta/downtown.svg', ['economy', 'interiors', 'housing'], 6, 1, '2026-10-18'],

  ['new-police-training-program', 'New LSPD Training Program', 'برنامه جدید آموزش پلیس',
   'Applications for the next LSPD cadet intake are open. Six sessions, real assessments, no shortcuts.',
   'ثبت‌نام دوره بعدی کادت‌های پلیس باز است.',
   `<p>آکادمی از اول ماه آینده با یک برنامه بازطراحی‌شده در شش جلسه بازگشایی می‌شود.</p>
    <h2>چه چیزی تغییر کرد</h2>
    <p>زمان کلاس تئوری را نصف کردیم و جای آن را با تمرین سناریو پر کردیم. کادت‌ها پیش از تأیید نهایی باید توقف‌های ترافیکی واقعی، سناریوهای کاهش تنش و یک توقف پرخطر کامل را اجرا کنند.</p>
    <h2>نحوه ثبت‌نام</h2>
    <p>یک تیکت با موضوع <strong>درخواست وایت‌لیست</strong> باز کنید. به ۲۰ ساعت سابقه بازی و پرونده پاک در سی روز گذشته نیاز دارید.</p>`,
   'announcement', 'assets/images/gta/police-hq.svg', ['lspd', 'whitelist'], 4, 0, '2026-10-11'],

  ['anti-cheat-upgrade-october', 'Anti-Cheat Upgrade and What It Means For You', 'ارتقای سیستم ضد تقلب',
   'We rebuilt detection around server-side validation. Here is exactly what we log and what we do not.',
   'سیستم تشخیص را بر پایه اعتبارسنجی سمت سرور بازسازی کردیم.',
   `<p>ضد تقلب سمت کلاینت نمایش است. هر چیزی که واقعاً اهمیت داشت را به سمت سرور منتقل کردیم.</p>
    <h2>چه چیزهایی را سمت سرور اعتبارسنجی می‌کنیم</h2>
    <ul><li>هر تراکنش پولی در برابر دفتر حساب سرور</li><li>هر آیتمی که ساخته می‌شود در برابر رویداد مبدأ آن</li><li>تغییر مکان بازیکن در برابر حرکت فیزیکی ممکن</li><li>آسیب سلاح در برابر تجهیزات ثبت‌شده</li></ul>
    <h2>چه کارهایی انجام نمی‌دهیم</h2>
    <p>ما فایل‌های سیستم شما، پردازه‌های دیگر و هر چیزی بیرون از کلاینت FiveM را نمی‌خوانیم. هرگز هم این کار را نخواهیم کرد.</p>`,
   'security', 'assets/images/backgrounds/gradient-dark.svg', ['security', 'transparency'], 5, 0, '2026-10-03'],

  ['street-racing-league-opens', 'The Vespucci Street Racing League Opens', 'لیگ مسابقات خیابانی وسپوچی',
   'Eight weeks, twelve circuits, one championship. Entry is free and the prize pool is player-funded.',
   'هشت هفته، دوازده مسیر، یک قهرمانی. ورود رایگان است.',
   `<p>دوازده مسیر در طول هشت هفته، با امتیازدهی به سبک فرمول یک.</p>
    <h2>کلاس‌ها</h2><ul><li>خیابانی (هندلینگ استوک)</li><li>تیونر (ارتقای کامل، بدون سوپراسپورت)</li><li>آزاد (هر چیزی با چهار چرخ)</li></ul>
    <h2>جایزه</h2><p>ورود رایگان است. صندوق جایزه از شرط‌بندی‌های اختیاری حاشیه تأمین می‌شود و سرور هیچ سهمی برنمی‌دارد.</p>`,
   'event', 'assets/images/gta/racing.svg', ['event', 'racing'], 3, 0, '2026-09-27'],

  ['ems-overhaul-pillbox', 'EMS Overhaul: Pillbox Goes Live', 'بازنگری EMS: بیمارستان پیل‌باکس',
   'Injuries now persist, treatment matters, and bleeding out is a real timer you can be saved from.',
   'جراحت‌ها ماندگار شدند و درمان اهمیت واقعی پیدا کرد.',
   `<p>سیستم قبلی دو حالت داشت: زنده و از کار افتاده. سیستم جدید یک بدن کامل دارد.</p>
    <h2>ماندگاری جراحت</h2><p>شلیک به پا تا زمانی که درمان نشود سرعت شما را می‌گیرد. زخم درمان‌نشده دوباره باز می‌شود.</p>
    <h2>تایمر خون‌ریزی</h2><p>حالا یک تایمر قابل مشاهده و قابل تمدید دارید. فشار دادن زخم توسط یک رهگذر برای شما چند دقیقه وقت می‌خرد.</p>`,
   'update', 'assets/images/characters/ems-medic.svg', ['ems', 'medical'], 4, 0, '2026-09-15'],

  ['scheduled-maintenance-notice', 'Scheduled Maintenance - Every Tuesday 04:00', 'تعمیرات دوره‌ای — هر سه‌شنبه ساعت ۴',
   'A 20-minute restart window every Tuesday keeps performance stable.',
   'یک پنجره راه‌اندازی مجدد ۲۰ دقیقه‌ای هر سه‌شنبه.',
   `<p>هر سه‌شنبه ساعت ۴ بامداد به وقت سرور، سرور را برای حدود بیست دقیقه از دسترس خارج می‌کنیم.</p>
    <h2>در این بازه چه می‌گذرد</h2><ul><li>پاک‌سازی دیتابیس و بازسازی ایندکس‌ها</li><li>ری‌استارت ریسورس‌ها برای آزاد شدن حافظه</li><li>بررسی صحت پشتیبان شبانه</li></ul>
    <p>شخصیت، پول و املاک شما پیش از ری‌استارت ذخیره می‌شوند. چیزی از دست نمی‌رود.</p>`,
   'maintenance', 'assets/images/backgrounds/gradient-dark.svg', ['maintenance'], 2, 0, '2026-09-02']
];

const COUPONS = [
  ['ROYAL10',  'percent', 10,    0,      null,   null, 1, '2027-03-20 23:59:59', '۱۰٪ تخفیف روی همه محصولات'],
  ['WINTER25', 'percent', 25,    300000, 200000, 500,  1, '2027-03-20 23:59:59', '۲۵٪ تخفیف خریدهای بالای ۳۰۰ هزار'],
  ['FIVER',    'fixed',   50000, 200000, null,   200,  1, '2027-03-20 23:59:59', '۵۰ هزار تومان تخفیف ثابت']
];

const SETTINGS = [
  ['site.name', 'ROYAL RP'],
  ['site.tagline', 'Premium FiveM Roleplay'],
  ['site.maintenance', false],
  ['shop.open', true],
  ['shop.autoDelivery', true],
  ['server.address', 'play.royalrp.example']
];

/* ===============================================================
   RUN
   =============================================================== */
/**
 * --refresh re-applies the shipped TEXT of products and articles to rows
 * that already exist (names, blurbs, feature lists, delivery notes,
 * article bodies). It deliberately leaves price, stock, visibility and
 * badges alone, because those are the shop owner's to set from the
 * admin panel and a re-seed must never undo their work.
 */
const REFRESH = process.argv.includes('--refresh');

async function main() {
  await db.connect();
  console.log('\n  Royal RP seed');

  let n = 0;
  const exists = async (sql, p) => !!(await db.get(sql, p));

  /* ---- categories ---- */
  for (const [id, slug, name, nameFa, icon, order] of CATEGORIES) {
    if (await exists('SELECT id FROM categories WHERE id = ?', [id])) continue;
    await db.run(
      'INSERT INTO categories (id, slug, name, name_fa, icon, sort_order, visible) VALUES (?,?,?,?,?,?,1)',
      [id, slug, name, nameFa, icon, order]
    );
    n++;
  }
  console.log(`  categories  ${CATEGORIES.length}`);

  /* ---- products ---- */
  let added = 0, refreshed = 0;
  for (const p of PRODUCTS) {
    const [id, cat, name, nameFa, price, oldPrice, image, short, features,
           stock, maxPer, duration, badge, featured, popular,
           dType, dPayload, dNote] = p;
    if (await exists('SELECT id FROM products WHERE id = ?', [id])) {
      if (REFRESH) {
        await db.run(
          `UPDATE products SET name = ?, name_fa = ?, short = ?, short_fa = ?, features = ?,
                  duration = ?, delivery_note = ?, updated_at = ? WHERE id = ?`,
          [name, nameFa, short, short, JSON.stringify(features), duration, dNote, db.now(), id]
        );
        refreshed++;
      }
      continue;
    }
    await db.run(
      `INSERT INTO products
        (id, slug, category_id, name, name_fa, short, short_fa, features, image, price, old_price,
         currency, stock, max_per_order, duration, badge, featured, popular, visible,
         delivery_type, delivery_payload, delivery_note, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'IRT',?,?,?,?,?,?,1,?,?,?,?,?)`,
      [id, id, cat, name, nameFa, short, short, JSON.stringify(features), image, price, oldPrice,
       stock, maxPer, duration, badge, featured, popular,
       dType, dPayload ? JSON.stringify(dPayload) : null, dNote, db.now(), db.now()]
    );
    added++;
  }
  console.log(`  products    ${PRODUCTS.length} (${added} new` +
              (REFRESH ? `, ${refreshed} text refreshed)` : ')'));

  /* ---- coupons ---- */
  for (const [code, type, value, min, maxDisc, maxUses, perUser, expires, label] of COUPONS) {
    if (await exists('SELECT code FROM coupons WHERE code = ?', [code])) continue;
    await db.run(
      `INSERT INTO coupons (code, type, value, min_spend, max_discount, max_uses, per_user, expires_at, active, label, created_at)
       VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
      [code, type, value, min, maxDisc, maxUses, perUser, expires, label, db.now()]
    );
  }
  console.log(`  coupons     ${COUPONS.length}`);

  /* ---- staff ---- */
  for (const [name, tag, role, bio, bioFa, avatar, since, order] of STAFF) {
    if (await exists('SELECT id FROM staff_members WHERE tag = ?', [tag])) continue;
    await db.run(
      'INSERT INTO staff_members (name, tag, role, bio, bio_fa, avatar, since, sort_order, visible) VALUES (?,?,?,?,?,?,?,?,1)',
      [name, tag, role, bio, bioFa, avatar, since, order]
    );
  }
  console.log(`  staff       ${STAFF.length}`);

  /* ---- gallery ---- */
  let gi = 0;
  for (const [src, title, titleFa, tag, size] of GALLERY) {
    gi++;
    if (await exists('SELECT id FROM gallery WHERE src = ? AND title = ?', [src, title])) continue;
    await db.run(
      'INSERT INTO gallery (src, title, title_fa, tag, size, sort_order, visible, created_at) VALUES (?,?,?,?,?,?,1,?)',
      [src, title, titleFa, tag, size, gi, db.now()]
    );
  }
  console.log(`  gallery     ${GALLERY.length}`);

  /* ---- news ---- */
  let newsRefreshed = 0;
  for (const [slug, title, titleFa, excerpt, excerptFa, body, cat, image, tags, mins, featured, date] of NEWS) {
    if (await exists('SELECT id FROM news WHERE slug = ?', [slug])) {
      if (REFRESH) {
        await db.run(
          `UPDATE news SET title = ?, title_fa = ?, excerpt = ?, excerpt_fa = ?,
                  body = ?, body_fa = ?, updated_at = ? WHERE slug = ?`,
          [title, titleFa, excerpt, excerptFa, body, body, db.now(), slug]
        );
        newsRefreshed++;
      }
      continue;
    }
    await db.run(
      `INSERT INTO news (slug, title, title_fa, excerpt, excerpt_fa, body, body_fa, category, image,
                         author_name, tags, read_minutes, featured, published, published_at, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)`,
      [slug, title, titleFa, excerpt, excerptFa, body, body, cat, image,
       'تیم توسعه رویال', JSON.stringify(tags), mins, featured,
       `${date} 12:00:00`, `${date} 12:00:00`, db.now()]
    );
  }
  console.log(`  news        ${NEWS.length}` +
              (REFRESH ? ` (${newsRefreshed} text refreshed)` : ''));

  /* ---- settings ---- */
  for (const [key, value] of SETTINGS) {
    if (await exists('SELECT key_name FROM settings WHERE key_name = ?', [key])) continue;
    await db.run('INSERT INTO settings (key_name, value, updated_at) VALUES (?, ?, ?)',
      [key, JSON.stringify(value), db.now()]);
  }
  console.log(`  settings    ${SETTINGS.length}`);

  /* ---- accounts ----
     None are created. The first account registered through the site is
     granted Owner automatically (backend/routes/auth.js), so there is
     never a shipped password for anyone to find. */
  const userCount = Number(await db.scalar('SELECT COUNT(*) AS n FROM users')) || 0;
  console.log(userCount === 0
    ? '  accounts    none - the first account you register becomes Owner'
    : `  accounts    ${userCount} already present - left alone`);

  console.log('\n  Seed complete.');
  if (userCount === 0) {
    console.log('\n  ----------------------------------------------------');
    console.log('   NEXT STEP: open the site and register an account.');
    console.log('   The first one becomes Owner and can reach /pages/admin.html');
    console.log('  ----------------------------------------------------\n');
  } else {
    console.log('');
  }

  await db.close();
}

main().catch(err => {
  console.error('\n  Seed failed:', err.message, '\n');
  console.error(err.stack);
  process.exit(1);
});
