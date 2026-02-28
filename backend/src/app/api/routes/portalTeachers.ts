import { FastifyInstance } from 'fastify';

interface PortalTeacher {
  id: string;
  name: string;
  subjects: string[];
  category: string;
  email?: string;
  phone?: string;
  office?: string;
  officeHours?: string;
  website?: string;
  bio?: string;
}

let cache: { data: PortalTeacher[]; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

async function scrapeTeachers(): Promise<PortalTeacher[]> {
  const response = await fetch('http://portal.lbi.ro/acasa/profesori/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ro-RO,ro;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  const html = await response.text();

  const teachers: PortalTeacher[] = [];
  const teacherPattern = /<td[^>]*class="[^"]*cmsmasters_table_cell_aligncenter[^"]*"[^>]*>([^<]*(?:<a[^>]*>[^<]*<\/a>[^<]*)?)<\/td>/gi;

  let match;
  const seenNames = new Set<string>();

  while ((match = teacherPattern.exec(html)) !== null) {
    let text = match[1];
    text = text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '–').trim();

    const profMatch = text.match(/^Prof\.?\s+(.+)$/i);
    if (profMatch) {
      let name = profMatch[1].trim();
      name = name.replace(/\s*–\s*Director( Adjunct)?$/i, '').trim();
      name = name.replace(/\s*-\s*Director( Adjunct)?$/i, '').trim();

      if (name.length > 3 && name.length < 80 && !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());

        const firstName = name.split(' ')[0];
        const lastName = name.split(' ').slice(1).join(' ');
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[-\s]+/g, '')}@lbi.ro`;

        teachers.push({
          id: `scraped-${teachers.length + 1}`,
          name: toTitleCase(name),
          subjects: findSubjectsForTeacher(name),
          category: determineCategory(name),
          email: email
        });
      }
    }
  }

  return teachers;
}

function determineCategory(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('director')) return 'Conducere';
  return 'Profesor';
}

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}

const teacherSubjectsFallback: Record<string, string[]> = {
  "monica-cristina anisie": ["Limba Română", "Limba și Literatura Română", "Limba Latină"],
  "georgeta david": ["Limba Română", "Limba și Literatura Română"],
  "lavinia elisabeta mihaela dumitrescu": ["Limba Română", "Limba și Literatura Română"],
  "maria-ramona nedea": ["Limba Română", "Limba și Literatura Română"],
  "constantin-ciprian nistor": ["Limba Română", "Limba și Literatura Română"],
  "carmen pleșa": ["Limba Română", "Limba și Literatura Română"],
  "ecaterina stanca": ["Limba Română", "Limba și Literatura Română"],
  "caloian mihaela georgiana": ["Limba Română", "Limba și Literatura Română"],
  "ghiță mihaela": ["Limba Română", "Limba și Literatura Română"],
  "tache lavinia": ["Limba Română", "Limba și Literatura Română"],
  "dumitru andreea-eugenia": ["Limba Engleză", "Cambridge"],
  "sălăjanu elena-iulia": ["Limba Engleză", "Cambridge"],
  "milicin corina": ["Limba Engleză", "Cambridge"],
  "poițelea monica": ["Limba Engleză", "Cambridge"],
  "cojocaru gina": ["Limba Engleză", "Cambridge"],
  "ioniță ioana-daniela": ["Limba Engleză", "Cambridge"],
  "george-octavian iosif": ["Limba Franceză", "Director Adjunct"],
  "mariana-eliza manz": ["Limba Franceză", "DELF"],
  "alina moraru": ["Limba Franceză", "DELF"],
  "munteanu mihaela": ["Limba Franceză", "DELF"],
  "pană ștefan": ["Limba Franceză", "DELF"],
  "ileana-carmen moldovan": ["Limba Franceză", "DELF"],
  "valentina morman": ["Limba Germană", "Literatură Germană"],
  "popescu-gavrilă octavia": ["Limba Germană", "Literatură Germană"],
  "victor-claudiu manz": ["Informatică", "C++"],
  "carmen nicoleta mincă": ["Informatică", "C++"],
  "corina-elena vinț": ["Informatică", "C++"],
  "alina boca": ["Informatică", "C++"],
  "oana maria lupașcu": ["Informatică", "C++", "TIC"],
  "elena drăgan": ["Informatică", "C++"],
  "isabela coman": ["Informatică", "Robotică"],
  "cătălina-anca enescu": ["Informatică", "C++"],
  "simona ionescu": ["Informatică", "C++"],
  "irina iosupescu": ["Informatică", "C++"],
  "cristina-maria olaru": ["Informatică", "C++"],
  "cristiana popescu": ["Informatică", "C++"],
  "dana botofei": ["Informatică", "C++"],
  "livia țoca": ["Informatică", "Baze de Date"],
  "anca leuciuc": ["Informatică", "C++"],
  "ioneci claudiu": ["Informatică", "C++"],
  "marcel-andrei homorodean": ["Informatică", "Java"],
  "costel-dobre chiteș": ["Matematică", "Calculus"],
  "monica-florentina dumitrache": ["Matematică", "Matematici Aplicate"],
  "mioara ioniță": ["Matematică", "Algebră"],
  "george-ionuț onișor": ["Matematică", "Geometrie/Trigonometie"],
  "cristian-teodor mangra": ["Matematică", "Matematici Aplicate"],
  "raluca mangra": ["Matematică", "Matematici Aplicate"],
  "severius moldoveanu": ["Matematică", "Matematici Aplicate"],
  "cristina-isabella caraman-hlevca": ["Matematică", "Algebră"],
  "ovidiu-mihai șontea": ["Matematică", "Geometrie/Trigonometrie"],
  "rică zamfir": ["Matematică", "Matematici Aplicate"],
  "sena azis": ["Matematică", "Algebră"],
  "mihai barbu": ["Fizică", "Termodinamica"],
  "daniel-ovidiu crocnan": ["Fizică", "Optică"],
  "corina dobrescu": ["Fizică", "Mecanica"],
  "ioana stoica": ["Fizică", "Optică"],
  "victor stoica": ["Fizică", "Optică"],
  "antona-irina tudorascu": ["Fizică", "Fizică Nucleară"],
  "bogdan sava": ["Fizică", "Mecanică Quantică"],
  "claudia-emilia anghel": ["Chimie", "Chimie Organică"],
  "alexandru bucur": ["Chimie", "Chimie Anorganică"],
  "mirela marcu": ["Chimie", "Chimie Organică"],
  "dimulescu gabriela": ["Chimie", "Chimie Anorganică"],
  "mirela-magdalena marinescu": ["Biologie", "Genetică"],
  "doriana-lucretia stoica": ["Biologie", "Medicină"],
  "simona vasilescu": ["Biologie", "Genetică"],
  "cleopatra banciu": ["Biologie", "Mediciă"],
  "diana-corina petculescu": ["Geografie", "Geopolitică"],
  "florentin rotea": ["Geografie", "Geopolitică"],
  "dan ciupercă": ["Istorie", "Istoria Româninei"],
  "vasilică donciu": ["Istorie", "Istoria României"],
  "veta grecu": ["Istorie", "Istoria României"],
  "crina savu": ["Logică", "Filozofie"],
  "manuela constantin": ["Educație Socială", "Psihologie"],
  "cătălin-mihăiță mihai": ["Psihologie", "Psihologia Umană"],
  "cristina-mariana vasile": ["Educație Antreprenorială", "Economie"],
  "ortansa-andreea farkaș": ["Sport", "Volley"],
  "ionela stan-cristache": ["Sport", "Volley"],
  "rus alexandru": ["Sport", "Fotbal"],
  "vlăduț marius steroiu": ["Sport", "Baschet"],
  "grațiela stoian": ["Educație Vizuală", "Educație Plastică"],
  "alina teac": ["Educație Muzicală", "Cultură Civică"],
  "cristina-manuela niculcea": ["Educație Tehnologică", "Aplicații Practice"],
  "veronica cosacenco": ["Religie", "Cultură Religioasă"],
  "marilena georgescu": ["Religie", "Cultură Religioasă"],
  "aurelia monica maran": ["Religie", "Literatură Religioasă"],
};

function findSubjectsForTeacher(name: string): string[] {
  const normalizedName = name.toLowerCase().replace(/[^a-zăâîșț]/g, ' ').replace(/\s+/g, ' ').trim();

  for (const [key, subjects] of Object.entries(teacherSubjectsFallback)) {
    const keyParts = key.split(' ');
    const nameParts = normalizedName.split(' ');
    const matchCount = keyParts.filter(part => nameParts.some(np => np.includes(part) || part.includes(np))).length;
    if (matchCount >= 2) {
      return subjects;
    }
  }
  return [];
}

export async function portalTeachersRoutes(server: FastifyInstance) {

  server.get('/portal/teachers', async (request, reply) => {
    try {
      if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
        return { teachers: cache.data, source: 'cache', count: cache.data.length, fetchedAt: new Date(cache.fetchedAt).toISOString() };
      }

      const scraped = await scrapeTeachers();
      cache = { data: scraped, fetchedAt: Date.now() };

      return {
        teachers: scraped,
        source: 'live',
        count: scraped.length,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      server.log.error(error, 'Failed to scrape teachers');

      if (cache) {
        return { teachers: cache.data, source: 'stale-cache', count: cache.data.length, fetchedAt: new Date(cache.fetchedAt).toISOString() };
      }

      return reply.status(502).send({
        error: 'Could not fetch teacher list',
        fallback: 'Visit http://portal.lbi.ro/acasa/profesori/ directly'
      });
    }
  });

  server.get('/portal/teachers/refresh', async () => {
    cache = null;
    const scraped = await scrapeTeachers();
    cache = { data: scraped, fetchedAt: Date.now() };
    return { refreshed: true, count: scraped.length, teachers: scraped };
  });
}
