export interface PortalTeacher {
  id: string;
  name: string;
  subjects: string[];
  category: string;
  email: string;
  phone?: string;
  office?: string;
  officeHours?: string;
  website?: string;
  bio?: string;
}

export const portalTeachers: PortalTeacher[] = [
  // Informatică
  {
    id: "info-1",
    name: "Prof. Ion Creangă",
    subjects: ["Informatică", "Algoritmi", "Structuri de Date"],
    category: "Informatică",
    email: "ion.creanga@lbi.ro",
    office: "Laborator Informatica 1",
    officeHours: "Marți 14:00-16:00"
  },
  {
    id: "info-2",
    name: "Prof. Maria Ionescu",
    subjects: ["Informatică", "Programare C++", "Olimpiade"],
    category: "Informatică",
    email: "maria.ionescu@lbi.ro",
    office: "Laborator Informatica 2",
    officeHours: "Miercuri 14:00-16:00"
  },
  {
    id: "info-3",
    name: "Prof. George Popescu",
    subjects: ["Informatică", "Python", "Inteligență Artificială"],
    category: "Informatică",
    email: "george.popescu@lbi.ro",
    office: "Laborator Informatica 3",
    officeHours: "Joi 15:00-17:00"
  },
  // Matematică
  {
    id: "math-1",
    name: "Prof. Elena Dumitrescu",
    subjects: ["Matematică", "Analiză Matematică", "Algebră"],
    category: "Matematică",
    email: "elena.dumitrescu@lbi.ro",
    office: "Cabinet 201",
    officeHours: "Luni 14:00-16:00"
  },
  {
    id: "math-2",
    name: "Prof. Andrei Georgescu",
    subjects: ["Matematică", "Geometrie", "Trigonometrie"],
    category: "Matematică",
    email: "andrei.georgescu@lbi.ro",
    office: "Cabinet 202",
    officeHours: "Marți 15:00-17:00"
  },
  {
    id: "math-3",
    name: "Prof. Cristina Popa",
    subjects: ["Matematică", "Probabilități", "Statistică"],
    category: "Matematică",
    email: "cristina.popa@lbi.ro",
    office: "Cabinet 203",
    officeHours: "Miercuri 14:00-16:00"
  },
  // Fizică
  {
    id: "fiz-1",
    name: "Prof. Ioana Stoica",
    subjects: ["Fizică", "Mecanică", "Electricitate"],
    category: "Fizică",
    email: "ioana.stoica@lbi.ro",
    office: "Cabinet Fizică 1",
    officeHours: "Luni 15:00-17:00"
  },
  {
    id: "fiz-2",
    name: "Prof. Mihai Istrate",
    subjects: ["Fizică", "Optică", "Termodinamică"],
    category: "Fizică",
    email: "mihai.istrate@lbi.ro",
    office: "Cabinet Fizică 2",
    officeHours: "Joi 14:00-16:00"
  },
  // Limba Română
  {
    id: "rom-1",
    name: "Prof. Ana Georgescu",
    subjects: ["Limba și Literatura Română", "Gramatica", "Literatura"],
    category: "Limba Română",
    email: "ana.georgescu@lbi.ro",
    office: "Cabinet 101",
    officeHours: "Marți 13:00-15:00"
  },
  {
    id: "rom-2",
    name: "Prof. Vasile Popa",
    subjects: ["Limba și Literatura Română", "Compoziție", "Retorică"],
    category: "Limba Română",
    email: "vasile.popa@lbi.ro",
    office: "Cabinet 102",
    officeHours: "Miercuri 13:00-15:00"
  },
  // Limbi Străine
  {
    id: "eng-1",
    name: "Prof. Laura Marinescu",
    subjects: ["Limba Engleză", "Literature Engleză", "Cambridge"],
    category: "Limba Engleză",
    email: "laura.marinescu@lbi.ro",
    office: "Cabinet 301",
    officeHours: "Luni 14:00-16:00"
  },
  {
    id: "eng-2",
    name: "Prof. Daniel Stoica",
    subjects: ["Limba Engleză", "Business English", "TOEFL"],
    category: "Limba Engleză",
    email: "daniel.stoica@lbi.ro",
    office: "Cabinet 302",
    officeHours: "Joi 14:00-16:00"
  },
  {
    id: "fr-1",
    name: "Prof. Sophie Martin",
    subjects: ["Limba Franceză", "Literature Franceză", "DELF"],
    category: "Limba Franceză",
    email: "sophie.martin@lbi.ro",
    office: "Cabinet 303",
    officeHours: "Marți 14:00-16:00"
  },
  {
    id: "ger-1",
    name: "Prof. Hans Mueller",
    subjects: ["Limba Germană", "Literatură Germană", "Goethe"],
    category: "Limba Germană",
    email: "hans.mueller@lbi.ro",
    office: "Cabinet 304",
    officeHours: "Miercuri 15:00-17:00"
  },
  // Chimie
  {
    id: "chim-1",
    name: "Prof. Elena Ionescu",
    subjects: ["Chimie", "Chimie Organică", "Chimie Anorganică"],
    category: "Chimie",
    email: "elena.ionescu-chimie@lbi.ro",
    office: "Cabinet Chimie",
    officeHours: "Luni 15:00-17:00"
  },
  // Biologie
  {
    id: "bio-1",
    name: "Prof. Maria Dumitrescu",
    subjects: ["Biologie", "Genetică", "Ecologie"],
    category: "Biologie",
    email: "maria.dumitrescu@lbi.ro",
    office: "Cabinet Biologie",
    officeHours: "Marți 15:00-17:00"
  },
  // Istorie
  {
    id: "ist-1",
    name: "Prof. Alexandru Popa",
    subjects: ["Istorie", "Istoria României", "Istorie Universală"],
    category: "Istorie",
    email: "alexandru.popa-ist@lbi.ro",
    office: "Cabinet 401",
    officeHours: "Joi 13:00-15:00"
  },
  // Geografie
  {
    id: "geo-1",
    name: "Prof. Irina Georgescu",
    subjects: ["Geografie", "Geografie Fizică", "Geografie Umană"],
    category: "Geografie",
    email: "irina.georgescu-geo@lbi.ro",
    office: "Cabinet 402",
    officeHours: "Miercuri 13:00-15:00"
  },
  // Educație Fizică
  {
    id: "ef-1",
    name: "Prof. Marius Popa",
    subjects: ["Educație Fizică", "Sport", "Handbal"],
    category: "Educație Fizică",
    email: "marius.popa-ef@lbi.ro",
    office: "Sala de Sport",
    officeHours: "Vineri 12:00-14:00"
  },
  {
    id: "ef-2",
    name: "Prof. Elena Vasile",
    subjects: ["Educație Fizică", "Atletism", "Baschet"],
    category: "Educație Fizică",
    email: "elena.vasile-ef@lbi.ro",
    office: "Sala de Sport",
    officeHours: "Vineri 14:00-16:00"
  },
  // Dirigenție / Consiliere
  {
    id: "dir-1",
    name: "Prof. Adriana Marinescu",
    subjects: ["Dirigenție", "Consiliere", "Admitere"],
    category: "Dirigenție",
    email: "adriana.marinescu-dir@lbi.ro",
    office: "Cabinet Consiliere",
    officeHours: "Miercuri 12:00-14:00"
  }
];

export const teacherCategories = [
  "Informatică",
  "Matematică",
  "Fizică",
  "Limba Română",
  "Limba Engleză",
  "Limba Franceză",
  "Limba Germană",
  "Chimie",
  "Biologie",
  "Istorie",
  "Geografie",
  "Educație Fizică",
  "Dirigenție"
];
