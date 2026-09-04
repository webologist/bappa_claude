require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const {
  Tenant, AudioContent, Event, Advertisement, Donation, GalleryPhoto
} = require('../models/Schemas');

function token() { return crypto.randomBytes(12).toString('hex'); }
function daysFromNow(d, hours = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(dt.getHours() + hours, 0, 0, 0);
  return dt;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  await Promise.all([
    Tenant.deleteMany({}), AudioContent.deleteMany({}), Event.deleteMany({}),
    Advertisement.deleteMany({}), Donation.deleteMany({}), GalleryPhoto.deleteMany({})
  ]);

  const tenantDefs = [
    { name: 'Shivaji Nagar Ganesh Mandal', slug: 'shivaji-nagar', adminEmail: 'admin@shivajinagar.org' },
    { name: 'Laxmi Chowk Utsav Samiti', slug: 'laxmi-chowk', adminEmail: 'admin@laxmichowk.org' }
  ];

  const tenants = await Tenant.insertMany(
    tenantDefs.map((t) => ({ ...t, adminToken: token(), logoUrl: '', isActive: true }))
  );

  const donorNames = [
    ['Ramesh Patil', '9876543210'], ['Sunita Deshmukh', '9823456712'],
    ['Amit Joshi', '9765432180'], ['Priya Kulkarni', '9654321870'],
    ['Vijay Shinde', '9543218760']
  ];
  const uploaderNames = [
    ['Anita Rane', '9432187650'], ['Sameer Bhosale', '9321876540'],
    ['Kavita More', '9218765430'], ['Rahul Naik', '9187654320']
  ];
  const statuses = ['PENDING', 'RECEIVED', 'REJECTED'];
  const photoStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

  for (const tenant of tenants) {
    await AudioContent.insertMany([
      {
        tenant: tenant._id,
        title: 'Sukhkarta Dukhharta Aarti',
        audioUrl: '/uploads/demo/sukhkarta-dukhharta.mp3',
        lyrics: {
          marathi: 'सुखकर्ता दुःखहर्ता वार्ता विघ्नाची।\nनुरवी पुरवी प्रेम कृपा जयाची।\nसर्वांगी सुंदर उटी शेंदुराची।\nकंठी झळके माळ मुक्ताफळांची॥\n\nजय देव जय देव जय मंगलमूर्ती।\nदर्शनमात्रे मनकामना पुरती॥\n\nरत्नखचित फरा तुज गौरीकुमरा।\nचंदनाची उटी कुमकुम केशरा।\nहिरेजडित मुकुट शोभतो बरा।\nरुणझुणती नूपुरे चरणी घागरिया॥\n\nलंबोदर पीतांबर फणिवरबंधना।\nसरळ सोंड वक्रतुंड त्रिनयना।\nदास रामाचा वाट पाहे सदना।\nसंकटी पावावे निर्वाणी रक्षावे सुरवरवंदना॥',
          gujarati: 'સુખકર્તા દુઃખહર્તા વાર્તા વિઘ્નાચી.\nનુરવી પુરવી પ્રેમ કૃપા જયાચી.\nસર્વાંગી સુંદર ઉટી શેંદુરાચી.\nકંઠી ઝળકે માળ મુક્તાફળાંચી.\n\nજય દેવ જય દેવ જય મંગલમૂર્તિ.\nદર્શનમાત્રે મનકામના પુરતી.\n\nરત્નખચિત ફરા તુજ ગૌરીકુમરા.\nચંદનાચી ઉટી કુમકુમ કેશરા.\nહિરેજડિત મુકુટ શોભતો બરા.\nરુણઝુણતી નૂપુરે ચરણી ઘાગરિયા.',
          english: 'Sukhkarta Dukhharta, varta vighnachi.\nNurvi purvi prem krupa jayachi.\nSarvangi sundar uti shendurachi.\nKanthi jhalke maal muktaphalanchi.\n\nJai dev jai dev jai mangalmurti.\nDarshanmatre mankamna purti.\n\nRatnakhachit phara tuj gaurikumara.\nChandanachi uti kumkum keshara.\nHirejadit mukut shobhato bara.\nRunjhunti nupure charani ghagariya.\n\nLambodar pitambar phanivarbandhana.\nSaral sond vakratunda trinayana.\nDas ramacha vaat pahe sadana.\nSankati pavave nirvani rakshave survarvandana.'
        },
        isFeatured: true
      },
      {
        tenant: tenant._id,
        title: 'Ganpati Bappa Morya',
        audioUrl: '/uploads/demo/ganpati-bappa-morya.mp3',
        lyrics: {
          marathi: 'गणपती बाप्पा मोरया, पुढच्या वर्षी लवकर या।',
          gujarati: 'ગણપતિ બાપ્પા મોરયા, પુઢચ્યા વર્ષી લવકર યા.',
          english: 'Ganpati Bappa Morya, Pudhachya Varshi Laukar Ya.'
        },
        isFeatured: false
      }
    ]);

    await Event.insertMany([
      { tenant: tenant._id, title: 'Morning Aarti', description: 'Daily morning aarti and prayers', startTime: daysFromNow(0, 7), endTime: daysFromNow(0, 8) },
      { tenant: tenant._id, title: 'Cultural Program', description: 'Dance and music performances by local artists', startTime: daysFromNow(1, 18), endTime: daysFromNow(1, 21) },
      { tenant: tenant._id, title: 'Visarjan Procession', description: 'Grand immersion procession', startTime: daysFromNow(10, 16), endTime: daysFromNow(10, 20) }
    ]);

    await Advertisement.insertMany([
      { tenant: tenant._id, imageUrl: '/uploads/demo/sponsor-banner-1.jpg', targetLink: 'https://example.com/sponsor1', isActive: true },
      { tenant: tenant._id, imageUrl: '/uploads/demo/sponsor-banner-2.jpg', targetLink: 'https://example.com/sponsor2', isActive: false }
    ]);

    await Donation.insertMany(
      donorNames.map(([donorName, donorPhone], i) => ({
        tenant: tenant._id,
        donorName,
        donorPhone,
        amount: [501, 1100, 2100, 5000, 250][i],
        status: statuses[i % statuses.length]
      }))
    );

    await GalleryPhoto.insertMany(
      uploaderNames.map(([uploaderName, uploaderPhone], i) => ({
        tenant: tenant._id,
        uploaderName,
        uploaderPhone,
        caption: ['At the pandal!', 'Aarti time', 'Family visit', 'Beautiful decoration'][i],
        watermarkedImageUrl: `/uploads/demo/gallery-${i + 1}.jpg`,
        status: photoStatuses[i % photoStatuses.length],
        likeCount: Math.floor(Math.random() * 20),
        viewCount: Math.floor(Math.random() * 100)
      }))
    );
  }

  const summary = { tenants, donations: [], photos: [] };
  for (const tenant of tenants) {
    summary.donations.push(...(await Donation.find({ tenant: tenant._id }).lean()).map((d) => ({ ...d, tenantSlug: tenant.slug })));
    summary.photos.push(...(await GalleryPhoto.find({ tenant: tenant._id }).lean()).map((p) => ({ ...p, tenantSlug: tenant.slug })));
  }

  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
