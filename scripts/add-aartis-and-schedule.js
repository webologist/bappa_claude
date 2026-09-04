// Adds Ganpati aartis sourced from https://nityapoojavidhi.blogspot.com/2018/09/blog-post.html
// (the traditional Marathi/Hindi Ganpati section of that aarti collection) and replaces each
// tenant's program schedule with a dummy 7-day festival calendar (13th-19th). Additive/idempotent
// for aartis (skips by title), but replaces the whole Event list per tenant.
require('dotenv').config();
const mongoose = require('mongoose');
const { Tenant, AudioContent, Event } = require('../models/Schemas');

const NEW_AARTIS = [
  {
    title: 'Shendur Lal Chadhayo',
    lyrics: {
      marathi: `शेंदुर लाल चढ़ायो अच्छा गजमुखको।
दोंदिल लाल बिराजे सुत गौरिहरको।
हाथ लिए गुडलड्डु सांई सुरवरको।
महिमा कहे न जाय लागत हूं पादको ॥१॥

जय जय श्री गणराज विद्या सुखदाता।
धन्य तुम्हारा दर्शन मेरा मन रमता ॥धृ॥

अष्टौ सिद्धि दासी संकटको बैरि।
विघ्नविनाशन मंगल मूरत अधिकारी।
कोटीसूरजप्रकाश ऐसी छबि तेरी।
गंडस्थलमदमस्तक झूले शशिबिहारी ॥२॥

भावभगत से कोई शरणागत आवे।
संतत संपत सबही भरपूर पावे।
ऐसे तुम महाराज मोको अति भावे।
गोसावीनंदन निशिदिन गुन गावे ॥३॥`,
      gujarati: `શેંદુર લાલ ચઢાયો અચ્છા ગજમુખકો.
દોંદિલ લાલ બિરાજે સુત ગૌરિહરકો.
હાથ લિયે ગુડલડ્ડુ સાંઈ સુરવરકો.
મહિમા કહે ન જાય લાગત હૂં પાદકો.

જય જય શ્રી ગણરાજ વિદ્યા સુખદાતા.
ધન્ય તુમ્હારા દર્શન મેરા મન રમતા.

અષ્ટૌ સિદ્ધિ દાસી સંકટકો બૈરિ.
વિઘ્નવિનાશન મંગલ મૂરત અધિકારી.
કોટીસૂરજપ્રકાશ ઐસી છબિ તેરી.
ગંડસ્થલમદમસ્તક ઝૂલે શશિબિહારી.

ભાવભગત સે કોઈ શરણાગત આવે.
સંતત સંપત સબહી ભરપૂર પાવે.
ઐસે તુમ મહારાજ મોકો અતિ ભાવે.
ગોસાવીનંદન નિશિદિન ગુન ગાવે.`,
      english: `Shendur lal chadhayo achha gajmukhko.
Dondil lal biraje sut gaurihar ko.
Hath liye gudladdu saayi survarko.
Mahima kahe na jaay lagat hoon paadko.

Jai jai shri ganaraj vidya sukhadata.
Dhanya tumhara darshan mera man ramata.

Ashtau siddhi dasi sankatko bairi.
Vighnavinashan mangal moorat adhikari.
Koti suraj prakash aisi chhabi teri.
Gandasthal madamastak jhoole shashibihari.

Bhaav bhagat se koi sharanagat aave.
Santat sampat sabahi bharpoor paave.
Aise tum maharaj moko ati bhave.
Gosavinandan nishidin gun gaave.`
    }
  },
  {
    title: 'Nana Parimal',
    lyrics: {
      marathi: `नाना परिमळ दुर्वा शेंदुर शमिपत्रें ।
लाडू मोदक अन्ने परिपूरित पात्रें ।
ऐसें पूजन केल्या बीजाक्षर मंत्रें ।
अष्टहि सिद्धि नवनिधि देसी क्षणमात्रें ॥१॥

जय देव जय देव जय मंगलमूर्ति ।
तुझे गुण वर्णाया मज कैंची स्फुर्ती ॥धृ॥

तुझे ध्यान निरंतर जे कोणी करिती ।
त्यांचीं सकलहि पापें विघ्नेंही हरती ।
वाजी वारण शिबिका सेवक सुत युवती ।
सर्वहि पावुनि अंतीं भवसागर तरती ॥२॥

शरणागत सर्वस्वें भजती तव चरणीं ।
किर्ति तयांची राहे जोवर शशितरणी ।
त्रैलोक्यीं ते विजयी अद्भुत हे करणी ।
गोसावीनंदन रत नामस्मरणीं ॥३॥`,
      gujarati: `નાના પરિમળ દુર્વા શેંદુર શમિપત્રે.
લાડૂ મોદક અન્ને પરિપૂરિત પાત્રે.
ઐસે પૂજન કેલ્યા બીજાક્ષર મંત્રે.
અષ્ટહિ સિદ્ધિ નવનિધિ દેસી ક્ષણમાત્રે.

જય દેવ જય દેવ જય મંગલમૂર્તિ.
તુઝે ગુણ વર્ણાયા મજ કૈંચી સ્ફુર્તી.

તુઝે ધ્યાન નિરંતર જે કોણી કરિતી.
ત્યાંચી સકલહિ પાપે વિઘ્નેંહી હરતી.
વાજી વારણ શિબિકા સેવક સુત યુવતી.
સર્વહિ પાવુની અંતી ભવસાગર તરતી.

શરણાગત સર્વસ્વે ભજતી તવ ચરણી.
કીર્તિ તયાંચી રાહે જોવર શશિતરણી.
ત્રૈલોક્યી તે વિજયી અદ્ભુત હે કરણી.
ગોસાવીનંદન રત નામસ્મરણી.`,
      english: `Nana parimal durva shendur shamipatre.
Ladoo modak anne paripoorit patre.
Aise poojan kelya beejakshar mantre.
Ashtahi siddhi navanidhi desi kshanmatre.

Jai dev jai dev jai mangalmurti.
Tujhe gun varnaya maj kainchi sphurti.

Tujhe dhyan nirantar je koni kariti.
Tyanchi sakalahi paape vighnenhi hariti.
Vaaji vaaran shibika sevak sut yuvati.
Sarvahi pavuni anti bhavasagar tariti.

Sharanagat sarvasve bhajati tav charani.
Kirti tayanchi rahe jovar shashitarani.
Trailokyi te vijayi adbhut he karani.
Gosavinandan rat naamasmarani.`
    }
  },
  {
    title: 'Ovalu Aarti Shri Ganpati Omkara',
    lyrics: {
      marathi: `ओवाळू आरती श्री गणपति ओंकारा ।
औट मात्रा कोटी सुर्यसम प्रभाकरा ॥ धृ ॥
बिंदुरुपे अचल अभय निर्गुण निराकारा ।
योगमाया अर्धमात्रा विचरि भवप्रसारा ॥ १ ॥
पीतवर्ण आकारमात्रा ब्रह्मसृजकारा ।
उकार जीमूतवर्ण रक्षिसी अखिल चराचरा ॥ २ ॥
लीन करिसी रक्तवर्ण तू सकल जगमकारा ।
अनन्यशरणागत या दासा तव पदी दे थारा ॥ ३ ॥`,
      gujarati: `ઓવાળૂ આરતી શ્રી ગણપતિ ઓંકારા.
ઔટ માત્રા કોટી સૂર્યસમ પ્રભાકરા.
બિંદુરૂપે અચલ અભય નિર્ગુણ નિરાકારા.
યોગમાયા અર્ધમાત્રા વિચરિ ભવપ્રસારા.
પીતવર્ણ આકારમાત્રા બ્રહ્મસૃજકારા.
ઉકાર જીમૂતવર્ણ રક્ષિસી અખિલ ચરાચરા.
લીન કરિસી રક્તવર્ણ તૂ સકલ જગમકારા.
અનન્યશરણાગત યા દાસા તવ પદી દે થારા.`,
      english: `Ovalu aarti shri ganpati omkara.
Aut matra koti suryasam prabhakara.
Bindurupe achal abhay nirgun nirakara.
Yogmaya ardhamatra vichari bhavaprasara.
Peetavarn aakarmatra brahmasrujakara.
Ukar jimootvarn rakshisi akhil characharaa.
Leen karisi raktavarn tu sakal jagamkara.
Ananyasharanagat ya dasa tav padi de thara.`
    }
  }
];

function dayAt(day, month, year, hour, minute = 0) {
  return new Date(year, month - 1, day, hour, minute, 0);
}

function programsFor(year, month) {
  return [
    { title: 'Ganesh Sthapana & Prathama Pooja', description: "Installation of Bappa's idol and the first ceremonial worship.", startTime: dayAt(13, month, year, 9, 0), endTime: dayAt(13, month, year, 11, 0) },
    { title: 'Bhajan Sandhya', description: 'Evening devotional bhajans and community singing.', startTime: dayAt(14, month, year, 19, 0), endTime: dayAt(14, month, year, 21, 0) },
    { title: 'Cultural Program – Dance & Music', description: 'Performances by local artists and youth groups.', startTime: dayAt(15, month, year, 19, 0), endTime: dayAt(15, month, year, 22, 0) },
    { title: "Kids' Fancy Dress Competition", description: 'Costume competition for children, prizes for top three.', startTime: dayAt(16, month, year, 17, 0), endTime: dayAt(16, month, year, 19, 0) },
    { title: 'Mahaprasad – Community Bhandara', description: 'Free community meal open to all devotees.', startTime: dayAt(17, month, year, 12, 0), endTime: dayAt(17, month, year, 14, 0) },
    { title: 'Rangoli & Decoration Competition', description: 'Rangoli contest and mandap decoration judging.', startTime: dayAt(18, month, year, 16, 0), endTime: dayAt(18, month, year, 18, 0) },
    { title: 'Ganpati Visarjan Procession', description: 'Grand immersion procession with dhol-tasha and community send-off.', startTime: dayAt(19, month, year, 15, 0), endTime: dayAt(19, month, year, 20, 0) }
  ];
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const tenants = await Tenant.find();
  const year = 2026;
  const month = 9;

  for (const tenant of tenants) {
    let added = 0;
    for (const aarti of NEW_AARTIS) {
      const exists = await AudioContent.findOne({ tenant: tenant._id, title: aarti.title });
      if (exists) continue;
      await AudioContent.create({ tenant: tenant._id, title: aarti.title, audioUrl: '', lyrics: aarti.lyrics });
      added++;
    }

    await Event.deleteMany({ tenant: tenant._id });
    const events = programsFor(year, month).map((e) => ({ ...e, tenant: tenant._id }));
    await Event.insertMany(events);

    console.log(`${tenant.slug}: +${added} aarti(s), schedule replaced with ${events.length} programs (Sep 13-19, ${year})`);
  }

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
