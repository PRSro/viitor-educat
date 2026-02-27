/**
 * Seed Script - Populates the database with open-source educational content
 * Creates 5+ courses per category, each with 3-15 lessons containing real resource links
 * Also creates 3 published articles
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const prisma = new PrismaClient();

function slug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function md(title: string, body: string, links: string[]): string {
    const linksMd = links.map((l, i) => `- [Resource ${i + 1}](${l})`).join('\n');
    return `# ${title}\n\n${body}\n\n## Resources\n\n${linksMd}`;
}

// ─── Course data per category ───
const COURSES: Record<string, { title: string; desc: string; level: string; tags: string[]; lessons: { title: string; desc: string; body: string; links: string[] }[] }[]> = {
    MATH: [
        {
            title: 'Introduction to Algebra', desc: 'Learn the fundamentals of algebraic thinking and problem solving.', level: 'BEGINNER', tags: ['algebra', 'fundamentals'],
            lessons: [
                { title: 'Variables and Expressions', desc: 'Understanding variables', body: 'Variables are symbols that represent unknown values. An expression combines variables, numbers, and operations.', links: ['https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra'] },
                { title: 'Solving Linear Equations', desc: 'One-step and multi-step equations', body: 'A linear equation is an equation where the highest power of the variable is 1. To solve, isolate the variable using inverse operations.', links: ['https://openstax.org/books/elementary-algebra-2e/pages/2-1-solve-equations-using-the-subtraction-and-addition-properties-of-equality'] },
                { title: 'Inequalities', desc: 'Working with inequalities', body: 'Inequalities compare two expressions using <, >, ≤, or ≥. Solving inequalities is similar to solving equations, but remember to flip the sign when multiplying or dividing by a negative number.', links: ['https://www.mathsisfun.com/algebra/inequality.html'] },
                { title: 'Graphing Linear Functions', desc: 'Plotting lines on the coordinate plane', body: 'A linear function has the form y = mx + b where m is the slope and b is the y-intercept.', links: ['https://www.desmos.com/calculator'] },
            ]
        },
        {
            title: 'Calculus I: Limits & Derivatives', desc: 'Explore the foundations of calculus including limits, continuity, and differentiation.', level: 'INTERMEDIATE', tags: ['calculus', 'derivatives'],
            lessons: [
                { title: 'What is a Limit?', desc: 'Introduction to limits', body: 'A limit describes the value a function approaches as the input approaches a given value.', links: ['https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/'] },
                { title: 'Limit Laws', desc: 'Rules for evaluating limits', body: 'Limit laws allow us to break complex limits into simpler parts using sum, product, and quotient rules.', links: ['https://openstax.org/books/calculus-volume-1/pages/2-3-the-limit-laws'] },
                { title: 'Continuity', desc: 'When functions are continuous', body: 'A function is continuous at a point if the limit exists, the function is defined, and they are equal.', links: ['https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new/ab-1-12/a/continuity-at-a-point-algebraically'] },
                { title: 'Definition of the Derivative', desc: 'The derivative as a limit', body: 'The derivative of f at x is defined as the limit of [f(x+h) - f(x)] / h as h approaches 0.', links: ['https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/1.-differentiation/'] },
                { title: 'Differentiation Rules', desc: 'Power, product, and chain rules', body: 'The power rule states d/dx[xⁿ] = nxⁿ⁻¹. The product and chain rules handle compositions.', links: ['https://openstax.org/books/calculus-volume-1/pages/3-3-differentiation-rules'] },
            ]
        },
        {
            title: 'Statistics & Probability', desc: 'Data analysis, distributions, and probability theory.', level: 'BEGINNER', tags: ['statistics', 'probability', 'data'],
            lessons: [
                { title: 'Descriptive Statistics', desc: 'Mean, median, mode', body: 'Descriptive statistics summarize data. The mean is the average, median is the middle value, and mode is the most frequent.', links: ['https://www.khanacademy.org/math/statistics-probability'] },
                { title: 'Probability Basics', desc: 'Fundamentals of probability', body: 'Probability measures the likelihood of an event occurring, expressed as a number between 0 and 1.', links: ['https://openstax.org/books/introductory-statistics/pages/3-1-terminology'] },
                { title: 'Normal Distribution', desc: 'The bell curve', body: 'The normal distribution is a symmetric, bell-shaped curve described by its mean and standard deviation.', links: ['https://www.mathsisfun.com/data/standard-normal-distribution.html'] },
            ]
        },
        {
            title: 'Geometry Essentials', desc: 'Shapes, angles, area, and volume.', level: 'BEGINNER', tags: ['geometry', 'shapes'],
            lessons: [
                { title: 'Points, Lines, and Planes', desc: 'Basic geometric objects', body: 'Points have no dimension, lines extend infinitely in both directions, and planes extend infinitely in two dimensions.', links: ['https://www.mathsisfun.com/geometry/point-line-plane-solid.html'] },
                { title: 'Triangles', desc: 'Properties of triangles', body: 'The sum of angles in a triangle is always 180°. Triangles are classified by sides (equilateral, isosceles, scalene) and angles.', links: ['https://www.khanacademy.org/math/geometry/hs-geo-triangles'] },
                { title: 'Circles', desc: 'Circle properties and formulas', body: 'A circle is the set of all points equidistant from a center. Area = πr², Circumference = 2πr.', links: ['https://www.mathsisfun.com/geometry/circle.html'] },
                { title: 'Area and Volume', desc: 'Calculating area and volume', body: 'Area measures 2D space; volume measures 3D space. Each shape has specific formulas.', links: ['https://openstax.org/books/prealgebra-2e/pages/9-9-use-properties-of-volume'] },
            ]
        },
        {
            title: 'Linear Algebra Fundamentals', desc: 'Vectors, matrices, and linear transformations.', level: 'ADVANCED', tags: ['linear-algebra', 'matrices', 'vectors'],
            lessons: [
                { title: 'Vectors in Rⁿ', desc: 'Vector operations', body: 'Vectors are ordered lists of numbers. We can add them component-wise and scale them by scalars.', links: ['https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/'] },
                { title: 'Matrix Operations', desc: 'Addition, multiplication', body: 'Matrices are rectangular arrays of numbers. Matrix multiplication is row-by-column, and is not commutative.', links: ['https://www.khanacademy.org/math/linear-algebra/vectors-and-spaces'] },
                { title: 'Determinants', desc: 'Computing determinants', body: 'The determinant of a square matrix encodes scaling and orientation information about the associated linear transformation.', links: ['https://www.3blue1brown.com/topics/linear-algebra'] },
            ]
        },
    ],
    SCIENCE: [
        {
            title: 'Physics: Mechanics', desc: 'Newton\'s laws, kinematics, and energy.', level: 'BEGINNER', tags: ['physics', 'mechanics'],
            lessons: [
                { title: 'Motion and Kinematics', desc: 'Describing movement', body: 'Kinematics describes motion using position, velocity, and acceleration without considering forces.', links: ['https://openstax.org/books/college-physics-2e/pages/2-1-displacement'] },
                { title: 'Newton\'s Laws of Motion', desc: 'The three laws', body: 'Newton\'s First Law: inertia. Second Law: F = ma. Third Law: every action has an equal and opposite reaction.', links: ['https://www.khanacademy.org/science/physics/forces-newtons-laws'] },
                { title: 'Work, Energy, and Power', desc: 'Conservation of energy', body: 'Work is force times displacement. Kinetic energy is ½mv². The work-energy theorem connects them.', links: ['https://openstax.org/books/college-physics-2e/pages/7-1-work-the-scientific-definition'] },
                { title: 'Momentum and Collisions', desc: 'Conservation of momentum', body: 'Momentum = mass × velocity. In a closed system, total momentum is conserved during collisions.', links: ['https://www.physicsclassroom.com/class/momentum'] },
            ]
        },
        {
            title: 'Chemistry Basics', desc: 'Atoms, bonding, and reactions.', level: 'BEGINNER', tags: ['chemistry', 'atoms'],
            lessons: [
                { title: 'Atomic Structure', desc: 'Protons, neutrons, electrons', body: 'Atoms consist of a nucleus (protons + neutrons) surrounded by electron clouds.', links: ['https://openstax.org/books/chemistry-2e/pages/2-2-evolution-of-atomic-theory'] },
                { title: 'The Periodic Table', desc: 'Organization of elements', body: 'Elements are arranged by atomic number. Groups share similar properties; periods show trends.', links: ['https://ptable.com/'] },
                { title: 'Chemical Bonding', desc: 'Ionic and covalent bonds', body: 'Ionic bonds transfer electrons; covalent bonds share electrons between atoms.', links: ['https://www.khanacademy.org/science/chemistry/atomic-structure-and-properties'] },
            ]
        },
        {
            title: 'Biology: Cell Biology', desc: 'Cell structure, function, and division.', level: 'BEGINNER', tags: ['biology', 'cells'],
            lessons: [
                { title: 'Cell Theory', desc: 'Foundations of cell biology', body: 'All living things are made of cells. Cells are the basic unit of life and come from pre-existing cells.', links: ['https://openstax.org/books/biology-2e/pages/4-1-studying-cells'] },
                { title: 'Cell Organelles', desc: 'Parts of the cell', body: 'Major organelles include the nucleus, mitochondria, endoplasmic reticulum, and Golgi apparatus.', links: ['https://www.khanacademy.org/science/biology/structure-of-a-cell'] },
                { title: 'Cell Division: Mitosis', desc: 'How cells reproduce', body: 'Mitosis divides a cell into two identical daughter cells through prophase, metaphase, anaphase, and telophase.', links: ['https://openstax.org/books/biology-2e/pages/10-2-the-cell-cycle'] },
            ]
        },
        {
            title: 'Earth Science', desc: 'Geology, weather, and the atmosphere.', level: 'BEGINNER', tags: ['earth-science', 'geology'],
            lessons: [
                { title: 'Plate Tectonics', desc: 'Moving continents', body: 'Earth\'s lithosphere is divided into tectonic plates that float on the asthenosphere and interact at boundaries.', links: ['https://www.usgs.gov/programs/earthquake-hazards/science/science-earthquakes'] },
                { title: 'The Water Cycle', desc: 'Evaporation, condensation, precipitation', body: 'Water continuously cycles through evaporation, condensation, precipitation, and collection.', links: ['https://www.usgs.gov/special-topics/water-science-school/science/water-cycle'] },
                { title: 'Weather and Climate', desc: 'Atmospheric phenomena', body: 'Weather is short-term atmospheric conditions; climate is the long-term average of weather patterns.', links: ['https://www.weather.gov/jetstream/'] },
            ]
        },
        {
            title: 'Astronomy: The Solar System', desc: 'Explore planets, stars, and space.', level: 'BEGINNER', tags: ['astronomy', 'space'],
            lessons: [
                { title: 'The Sun and Stars', desc: 'Our star', body: 'The Sun is a G-type main-sequence star. It produces energy through nuclear fusion of hydrogen into helium.', links: ['https://science.nasa.gov/sun/'] },
                { title: 'The Planets', desc: 'Eight planets of our solar system', body: 'Our solar system has four rocky inner planets (Mercury, Venus, Earth, Mars) and four gas/ice giants.', links: ['https://science.nasa.gov/solar-system/planets/'] },
                { title: 'Moons and Asteroids', desc: 'Smaller bodies', body: 'Moons orbit planets. Our Moon stabilizes Earth\'s axial tilt. The asteroid belt lies between Mars and Jupiter.', links: ['https://science.nasa.gov/solar-system/'] },
            ]
        },
    ],
    LITERATURE: [
        {
            title: 'Introduction to Poetry', desc: 'Rhyme, meter, and poetic devices.', level: 'BEGINNER', tags: ['poetry', 'writing'],
            lessons: [
                { title: 'What is Poetry?', desc: 'Defining poetry', body: 'Poetry is a literary form that uses aesthetic and rhythmic qualities of language to evoke meaning.', links: ['https://www.poetryfoundation.org/'] },
                { title: 'Rhyme and Meter', desc: 'Sound patterns', body: 'Meter is the rhythmic pattern of stressed and unstressed syllables. Common meters include iambic pentameter.', links: ['https://www.poetryfoundation.org/learn/glossary-terms'] },
                { title: 'Figurative Language', desc: 'Metaphor, simile, imagery', body: 'Figurative language uses words beyond their literal meaning: metaphors compare directly, similes use "like" or "as."', links: ['https://literarydevices.net/'] },
            ]
        },
        {
            title: 'Shakespeare\'s Greatest Works', desc: 'Exploring the Bard\'s plays and sonnets.', level: 'INTERMEDIATE', tags: ['shakespeare', 'drama'],
            lessons: [
                { title: 'Hamlet', desc: 'To be or not to be', body: 'Hamlet explores themes of revenge, mortality, and indecision. Prince Hamlet must avenge his father\'s murder.', links: ['https://www.gutenberg.org/ebooks/1524'] },
                { title: 'Romeo and Juliet', desc: 'Star-crossed lovers', body: 'A tragedy of two young lovers from feuding families in Verona. It explores love, fate, and impulsive youth.', links: ['https://www.gutenberg.org/ebooks/1112'] },
                { title: 'Macbeth', desc: 'Ambition and guilt', body: 'Macbeth, a Scottish general, descends into madness after murdering King Duncan to seize the throne.', links: ['https://www.gutenberg.org/ebooks/1533'] },
                { title: 'The Sonnets', desc: 'Shall I compare thee', body: 'Shakespeare wrote 154 sonnets exploring love, beauty, mortality, and time. Most follow the English sonnet form.', links: ['https://www.gutenberg.org/ebooks/1041'] },
            ]
        },
        {
            title: 'World Mythology', desc: 'Greek, Norse, Egyptian, and Asian myths.', level: 'BEGINNER', tags: ['mythology', 'culture'],
            lessons: [
                { title: 'Greek Mythology', desc: 'Zeus, Athena, and Olympus', body: 'Greek mythology centers on the twelve Olympian gods, heroes like Heracles, and epic journeys like the Odyssey.', links: ['https://www.theoi.com/'] },
                { title: 'Norse Mythology', desc: 'Odin, Thor, and Ragnarök', body: 'Norse myths describe nine worlds connected by Yggdrasil, the World Tree, and the eventual Ragnarök.', links: ['https://www.gutenberg.org/ebooks/14726'] },
                { title: 'Egyptian Mythology', desc: 'Ra, Isis, and the afterlife', body: 'Egyptian mythology is deeply connected to the afterlife, with gods like Osiris, Isis, and Ra.', links: ['https://www.britannica.com/topic/Egyptian-mythology'] },
            ]
        },
        {
            title: 'Creative Writing Workshop', desc: 'Develop your fiction writing skills.', level: 'BEGINNER', tags: ['writing', 'creative'],
            lessons: [
                { title: 'Character Development', desc: 'Building compelling characters', body: 'Strong characters have goals, flaws, and arcs. Use backstory, dialogue, and action to reveal character.', links: ['https://www.masterclass.com/articles/how-to-develop-a-fictional-character'] },
                { title: 'Plot Structure', desc: 'Beginning, middle, end', body: 'Most stories follow a structure: exposition, rising action, climax, falling action, and resolution.', links: ['https://owl.purdue.edu/owl/general_writing/the_writing_process/index.html'] },
                { title: 'Dialogue Writing', desc: 'Making characters speak', body: 'Good dialogue reveals character, advances plot, and sounds natural. Avoid exposition dumps in speech.', links: ['https://www.writingforward.com/creative-writing/writing-dialogue'] },
            ]
        },
        {
            title: 'Classic Novels Analysis', desc: 'Deep dives into literary masterpieces.', level: 'INTERMEDIATE', tags: ['novels', 'analysis'],
            lessons: [
                { title: 'Pride and Prejudice', desc: 'Jane Austen\'s social commentary', body: 'Austen\'s novel critiques class, marriage, and morality in Regency-era England through Elizabeth Bennet\'s story.', links: ['https://www.gutenberg.org/ebooks/1342'] },
                { title: '1984 by George Orwell', desc: 'Dystopian masterpiece', body: 'Orwell\'s novel warns against totalitarianism, surveillance, and the manipulation of truth by authoritarian regimes.', links: ['https://www.george-orwell.org/1984'] },
                { title: 'The Great Gatsby', desc: 'The American Dream', body: 'Fitzgerald\'s novel explores wealth, idealism, and disillusionment in Jazz Age America through Jay Gatsby.', links: ['https://www.gutenberg.org/ebooks/64317'] },
            ]
        },
    ],
    HISTORY: [
        {
            title: 'Ancient Civilizations', desc: 'Mesopotamia, Egypt, Greece, and Rome.', level: 'BEGINNER', tags: ['ancient', 'civilizations'],
            lessons: [
                { title: 'Mesopotamia', desc: 'Cradle of civilization', body: 'Mesopotamia, between the Tigris and Euphrates rivers, saw the rise of writing, law codes, and city-states.', links: ['https://www.worldhistory.org/Mesopotamia/'] },
                { title: 'Ancient Egypt', desc: 'Pharaohs and pyramids', body: 'Egyptian civilization thrived along the Nile for 3,000 years, building pyramids and developing hieroglyphics.', links: ['https://www.worldhistory.org/egypt/'] },
                { title: 'Classical Greece', desc: 'Democracy and philosophy', body: 'Athens pioneered democracy. Philosophers like Socrates, Plato, and Aristotle shaped Western thought.', links: ['https://www.worldhistory.org/greece/'] },
                { title: 'The Roman Empire', desc: 'Rise and fall', body: 'Rome grew from a city-state to an empire spanning three continents before falling in 476 CE.', links: ['https://www.worldhistory.org/Roman_Empire/'] },
            ]
        },
        {
            title: 'World War I & II', desc: 'The great conflicts of the 20th century.', level: 'INTERMEDIATE', tags: ['world-war', 'modern'],
            lessons: [
                { title: 'Causes of World War I', desc: 'Alliances, imperialism, nationalism', body: 'WWI was triggered by the assassination of Archduke Franz Ferdinand but rooted in alliance systems and imperial rivalry.', links: ['https://www.nationalww1museum.org/'] },
                { title: 'The Western Front', desc: 'Trench warfare', body: 'The Western Front stretched from Belgium to Switzerland. Soldiers endured horrific conditions in trenches.', links: ['https://www.iwm.org.uk/history/first-world-war'] },
                { title: 'Rise of Fascism', desc: 'Between the wars', body: 'Economic depression and political instability led to the rise of fascist regimes in Italy and Germany.', links: ['https://www.britannica.com/topic/fascism'] },
                { title: 'World War II Overview', desc: 'Global conflict', body: 'WWII (1939-1945) involved most of the world\'s nations. It resulted in an estimated 70-85 million deaths.', links: ['https://www.nationalww2museum.org/'] },
                { title: 'The Holocaust', desc: 'Genocide and remembrance', body: 'The Nazi regime systematically murdered six million Jews and millions of others during the Holocaust.', links: ['https://www.ushmm.org/'] },
            ]
        },
        {
            title: 'The Cold War', desc: 'East vs. West from 1947-1991.', level: 'INTERMEDIATE', tags: ['cold-war', 'modern'],
            lessons: [
                { title: 'Origins of the Cold War', desc: 'Post-WWII tensions', body: 'The Cold War emerged from ideological conflict between the capitalist US and communist Soviet Union.', links: ['https://www.jfklibrary.org/learn/about-jfk/jfk-in-history/the-cold-war'] },
                { title: 'The Space Race', desc: 'Sputnik to Apollo', body: 'The US and USSR competed for supremacy in space exploration, culminating in the Apollo 11 moon landing.', links: ['https://www.nasa.gov/history/'] },
                { title: 'Fall of the Berlin Wall', desc: 'End of an era', body: 'The Berlin Wall fell on November 9, 1989, symbolizing the end of the Cold War division of Europe.', links: ['https://www.history.com/topics/cold-war/berlin-wall'] },
            ]
        },
        {
            title: 'History of Science', desc: 'From alchemy to quantum physics.', level: 'INTERMEDIATE', tags: ['science-history'],
            lessons: [
                { title: 'The Scientific Revolution', desc: 'Copernicus to Newton', body: 'The Scientific Revolution (16th-18th century) transformed understanding of nature through observation and mathematics.', links: ['https://www.britannica.com/science/Scientific-Revolution'] },
                { title: 'Darwin and Evolution', desc: 'Natural selection', body: 'Charles Darwin\'s theory of evolution by natural selection revolutionized biology and our understanding of life.', links: ['https://www.darwinproject.ac.uk/'] },
                { title: 'The Atomic Age', desc: 'Nuclear physics', body: 'The discovery of radioactivity and splitting of the atom led to both nuclear energy and nuclear weapons.', links: ['https://www.atomicheritage.org/'] },
            ]
        },
        {
            title: 'Romanian History', desc: 'From Dacia to modern Romania.', level: 'BEGINNER', tags: ['romania', 'eastern-europe'],
            lessons: [
                { title: 'Ancient Dacia', desc: 'Before the Romans', body: 'The Dacians were a Thracian people who built a powerful kingdom centered in the Carpathian Mountains.', links: ['https://www.worldhistory.org/Dacia/'] },
                { title: 'Roman Dacia', desc: 'Trajan\'s conquest', body: 'Emperor Trajan conquered Dacia in 106 CE. Roman colonization deeply influenced the region\'s language and culture.', links: ['https://www.worldhistory.org/article/58/the-dacian-wars/'] },
                { title: 'Medieval Principalities', desc: 'Wallachia, Moldavia, Transylvania', body: 'Three medieval principalities formed the core of what would become Romania, each with distinct histories.', links: ['https://www.britannica.com/place/Romania/History'] },
            ]
        },
    ],
    COMPUTER_SCIENCE: [
        {
            title: 'Python for Beginners', desc: 'Learn Python programming from scratch.', level: 'BEGINNER', tags: ['python', 'programming'],
            lessons: [
                { title: 'Getting Started with Python', desc: 'Installation and first program', body: 'Python is a versatile, beginner-friendly language. Install it and write your first "Hello, World!" program.', links: ['https://docs.python.org/3/tutorial/'] },
                { title: 'Variables and Data Types', desc: 'Strings, integers, floats, booleans', body: 'Python variables don\'t need type declarations. Common types: str, int, float, bool, list, dict.', links: ['https://realpython.com/python-data-types/'] },
                { title: 'Control Flow', desc: 'If statements and loops', body: 'Use if/elif/else for decisions. For loops iterate over sequences; while loops repeat until a condition is false.', links: ['https://docs.python.org/3/tutorial/controlflow.html'] },
                { title: 'Functions', desc: 'Defining reusable code', body: 'Functions are defined with `def`. They can accept parameters and return values. Functions promote code reuse.', links: ['https://docs.python.org/3/tutorial/controlflow.html#defining-functions'] },
                { title: 'Working with Files', desc: 'Reading and writing files', body: 'Use open() with context managers (with statement) to safely read and write files in Python.', links: ['https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files'] },
            ]
        },
        {
            title: 'Web Development with HTML & CSS', desc: 'Build beautiful web pages.', level: 'BEGINNER', tags: ['html', 'css', 'web'],
            lessons: [
                { title: 'HTML Basics', desc: 'Structure of web pages', body: 'HTML uses tags to structure content: headings, paragraphs, links, images, lists, and more.', links: ['https://developer.mozilla.org/en-US/docs/Learn/HTML'] },
                { title: 'CSS Fundamentals', desc: 'Styling web pages', body: 'CSS controls visual presentation: colors, fonts, layout, spacing, and responsive design.', links: ['https://developer.mozilla.org/en-US/docs/Learn/CSS'] },
                { title: 'Responsive Design', desc: 'Mobile-friendly layouts', body: 'Use media queries, flexbox, and grid to create layouts that adapt to different screen sizes.', links: ['https://web.dev/responsive-web-design-basics/'] },
            ]
        },
        {
            title: 'JavaScript Essentials', desc: 'Interactive web programming.', level: 'BEGINNER', tags: ['javascript', 'web'],
            lessons: [
                { title: 'Variables and Types', desc: 'let, const, and data types', body: 'JavaScript uses let and const for variable declarations. Types include string, number, boolean, object, and array.', links: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide'] },
                { title: 'Functions and Scope', desc: 'Function declarations and closures', body: 'Functions can be declared, expressed, or arrow functions. Scope determines variable accessibility.', links: ['https://javascript.info/function-basics'] },
                { title: 'DOM Manipulation', desc: 'Interacting with web pages', body: 'The DOM represents the page structure. Use document.querySelector() and event listeners to make pages interactive.', links: ['https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model'] },
                { title: 'Async JavaScript', desc: 'Promises and async/await', body: 'Asynchronous code handles operations like API calls. Promises and async/await make async code readable.', links: ['https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous'] },
            ]
        },
        {
            title: 'Data Structures & Algorithms', desc: 'Essential CS concepts for problem solving.', level: 'ADVANCED', tags: ['algorithms', 'data-structures'],
            lessons: [
                { title: 'Arrays and Strings', desc: 'Sequential data', body: 'Arrays store ordered collections. Common operations: traversal, searching, sorting. Time complexity matters.', links: ['https://www.geeksforgeeks.org/array-data-structure/'] },
                { title: 'Linked Lists', desc: 'Dynamic data structures', body: 'Linked lists store data in nodes with pointers. They allow efficient insertion/deletion but slow random access.', links: ['https://visualgo.net/en/list'] },
                { title: 'Trees and Graphs', desc: 'Hierarchical and network data', body: 'Binary trees, BSTs, and graphs model hierarchical and network relationships. Traversals: DFS, BFS.', links: ['https://visualgo.net/en/bst'] },
                { title: 'Sorting Algorithms', desc: 'Organizing data efficiently', body: 'Key algorithms: bubble sort O(n²), merge sort O(n log n), quicksort O(n log n) average.', links: ['https://www.toptal.com/developers/sorting-algorithms'] },
            ]
        },
        {
            title: 'Introduction to Git & GitHub', desc: 'Version control for developers.', level: 'BEGINNER', tags: ['git', 'github', 'version-control'],
            lessons: [
                { title: 'What is Version Control?', desc: 'Tracking changes', body: 'Version control tracks file changes over time, enabling collaboration and history management.', links: ['https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control'] },
                { title: 'Basic Git Commands', desc: 'init, add, commit, push', body: 'Core workflow: git init → git add → git commit → git push. Each commit is a snapshot of your project.', links: ['https://git-scm.com/docs'] },
                { title: 'Branching and Merging', desc: 'Parallel development', body: 'Branches allow parallel development. Create feature branches, then merge them back into the main branch.', links: ['https://docs.github.com/en/pull-requests/collaborating-with-pull-requests'] },
            ]
        },
    ],
    ARTS: [
        {
            title: 'Drawing Fundamentals', desc: 'Learn to draw from basic shapes to complex forms.', level: 'BEGINNER', tags: ['drawing', 'sketching'],
            lessons: [
                { title: 'Lines and Shapes', desc: 'Basic building blocks', body: 'All complex drawings start with basic shapes: circles, squares, triangles. Practice confident line work.', links: ['https://drawabox.com/lesson/1'] },
                { title: 'Light and Shadow', desc: 'Creating form with value', body: 'Understanding light direction creates the illusion of 3D form. Practice shading spheres and cubes.', links: ['https://drawabox.com/lesson/2'] },
                { title: 'Perspective Drawing', desc: 'Creating depth', body: 'Perspective uses vanishing points to create the illusion of depth on a 2D surface.', links: ['https://drawabox.com/lesson/3'] },
            ]
        },
        {
            title: 'Music Theory Basics', desc: 'Notes, scales, chords, and rhythm.', level: 'BEGINNER', tags: ['music', 'theory'],
            lessons: [
                { title: 'Reading Sheet Music', desc: 'Notes and staff', body: 'The musical staff has five lines. Notes on the treble clef: Every Good Boy Does Fine (lines), FACE (spaces).', links: ['https://www.musictheory.net/lessons'] },
                { title: 'Scales and Keys', desc: 'Major and minor scales', body: 'A major scale follows the pattern W-W-H-W-W-W-H. Keys define which notes are sharp or flat.', links: ['https://www.musictheory.net/lessons/21'] },
                { title: 'Chords and Harmony', desc: 'Building chords', body: 'Chords are three or more notes played together. Major chords sound happy; minor chords sound sad.', links: ['https://www.musictheory.net/lessons/40'] },
            ]
        },
        {
            title: 'Art History: Renaissance to Modern', desc: 'Major art movements and their masters.', level: 'INTERMEDIATE', tags: ['art-history', 'movements'],
            lessons: [
                { title: 'The Renaissance', desc: 'Rebirth of art', body: 'The Renaissance (14th-17th century) saw a revival of classical ideals. Key artists: Leonardo, Michelangelo, Raphael.', links: ['https://www.metmuseum.org/toah/hd/ren/hd_ren.htm'] },
                { title: 'Impressionism', desc: 'Light and color', body: 'Impressionists like Monet and Renoir captured fleeting moments with visible brushstrokes and vibrant color.', links: ['https://www.metmuseum.org/toah/hd/imml/hd_imml.htm'] },
                { title: 'Modern Art', desc: 'Breaking conventions', body: 'Modern art (late 19th-mid 20th century) challenged traditions through abstraction, cubism, and expressionism.', links: ['https://www.moma.org/learn/moma_learning/'] },
            ]
        },
        {
            title: 'Digital Photography', desc: 'Camera settings, composition, and editing.', level: 'BEGINNER', tags: ['photography', 'digital'],
            lessons: [
                { title: 'Understanding Exposure', desc: 'Aperture, shutter speed, ISO', body: 'The exposure triangle: aperture controls depth of field, shutter speed controls motion blur, ISO controls sensitivity.', links: ['https://www.cambridgeincolour.com/tutorials/camera-exposure.htm'] },
                { title: 'Composition Rules', desc: 'Rule of thirds and leading lines', body: 'The rule of thirds divides the frame into a 3×3 grid. Place subjects at intersections for visual interest.', links: ['https://www.bhphotovideo.com/explora/photography/tips-and-solutions/11-thoughts-introduction-compositional-rules'] },
                { title: 'Photo Editing Basics', desc: 'Post-processing', body: 'Basic edits: crop, exposure, contrast, white balance, saturation. Use free tools like GIMP or RawTherapee.', links: ['https://www.gimp.org/tutorials/'] },
            ]
        },
        {
            title: 'Introduction to Film', desc: 'Cinematography, editing, and storytelling.', level: 'BEGINNER', tags: ['film', 'cinema'],
            lessons: [
                { title: 'The Language of Film', desc: 'Shots, angles, movement', body: 'Film uses visual language: wide shots establish setting, close-ups show emotion, camera movement guides attention.', links: ['https://nofilmschool.com/'] },
                { title: 'Editing and Montage', desc: 'Assembling the story', body: 'Editing creates meaning by juxtaposing shots. Montage theory shows that meaning emerges between shots.', links: ['https://www.filmeditingpro.com/'] },
                { title: 'Sound and Music in Film', desc: 'Audio storytelling', body: 'Film sound includes dialogue, sound effects, ambient noise, and music score. Sound deeply affects emotion.', links: ['https://www.filmsound.org/'] },
            ]
        },
    ],
    LANGUAGES: [
        {
            title: 'English Grammar Essentials', desc: 'Master English grammar rules.', level: 'BEGINNER', tags: ['english', 'grammar'],
            lessons: [
                { title: 'Parts of Speech', desc: 'Nouns, verbs, adjectives', body: 'English has 8 parts of speech: nouns, pronouns, verbs, adjectives, adverbs, prepositions, conjunctions, interjections.', links: ['https://www.grammarly.com/blog/parts-of-speech/'] },
                { title: 'Verb Tenses', desc: 'Past, present, future', body: 'English has 12 tenses combining simple, continuous, perfect, and perfect continuous with past, present, future.', links: ['https://www.englishpage.com/verbpage/verbtenseintro.html'] },
                { title: 'Sentence Structure', desc: 'Building correct sentences', body: 'Basic sentence: Subject + Verb + Object. Compound and complex sentences use conjunctions and clauses.', links: ['https://owl.purdue.edu/owl/general_writing/mechanics/sentence_structure.html'] },
            ]
        },
        {
            title: 'French for Beginners', desc: 'Bonjour! Start your French journey.', level: 'BEGINNER', tags: ['french', 'beginner'],
            lessons: [
                { title: 'Greetings and Introductions', desc: 'Bonjour, je m\'appelle...', body: 'Learn basic French greetings: Bonjour (hello), Au revoir (goodbye), Comment allez-vous? (How are you?).', links: ['https://www.lawlessfrench.com/'] },
                { title: 'Numbers and Colors', desc: 'Un, deux, trois...', body: 'French numbers: un, deux, trois, quatre, cinq... Colors: rouge, bleu, vert, jaune, noir, blanc.', links: ['https://www.francaisfacile.com/'] },
                { title: 'Present Tense Verbs', desc: 'Regular -er, -ir, -re verbs', body: 'French regular verbs follow patterns. -er verbs (parler): je parle, tu parles, il parle, nous parlons...', links: ['https://www.lawlessfrench.com/grammar/present-tense/'] },
            ]
        },
        {
            title: 'Spanish Fundamentals', desc: '¡Hola! Learn the basics of Spanish.', level: 'BEGINNER', tags: ['spanish', 'beginner'],
            lessons: [
                { title: 'Basic Conversation', desc: 'Hola, ¿cómo estás?', body: 'Spanish greetings: Hola (hello), Buenos días (good morning), ¿Cómo te llamas? (What is your name?).', links: ['https://www.spanishdict.com/guide'] },
                { title: 'Ser vs. Estar', desc: 'Two verbs for "to be"', body: 'Ser is for permanent characteristics; estar is for temporary states, locations, and emotions.', links: ['https://www.spanishdict.com/guide/ser-vs-estar'] },
                { title: 'Common Vocabulary', desc: 'Essential words and phrases', body: 'Learn essential vocabulary: food, family, directions, time, and common verbs for everyday communication.', links: ['https://www.studyspanish.com/'] },
            ]
        },
        {
            title: 'Romanian Language Basics', desc: 'Learn the Romanian language.', level: 'BEGINNER', tags: ['romanian', 'limba-romana'],
            lessons: [
                { title: 'Romanian Alphabet', desc: 'Letters and pronunciation', body: 'Romanian uses the Latin alphabet with 5 special characters: ă, â, î, ș, ț. Most letters sound as expected.', links: ['https://www.romanianpod101.com/'] },
                { title: 'Basic Phrases', desc: 'Bună ziua, mulțumesc', body: 'Essential phrases: Bună ziua (good day), Mulțumesc (thank you), Vă rog (please), Da/Nu (yes/no).', links: ['https://www.loecsen.com/en/learn-romanian'] },
                { title: 'Nouns and Articles', desc: 'Gender and definite articles', body: 'Romanian nouns have three genders. The definite article is attached as a suffix: casa → the house.', links: ['https://www.romanianpod101.com/'] },
            ]
        },
        {
            title: 'Academic Writing in English', desc: 'Write essays, reports, and research papers.', level: 'INTERMEDIATE', tags: ['academic', 'writing', 'english'],
            lessons: [
                { title: 'Essay Structure', desc: 'Introduction, body, conclusion', body: 'Academic essays follow a clear structure: thesis statement, supporting arguments with evidence, and a conclusion.', links: ['https://owl.purdue.edu/owl/general_writing/academic_writing/essay_writing/index.html'] },
                { title: 'Citations and References', desc: 'APA, MLA, Chicago', body: 'Academic integrity requires proper citation. Learn APA (social sciences), MLA (humanities), and Chicago styles.', links: ['https://owl.purdue.edu/owl/research_and_citation/resources.html'] },
                { title: 'Research Methods', desc: 'Finding and evaluating sources', body: 'Use academic databases like Google Scholar and JSTOR. Evaluate sources for reliability, credibility, and relevance.', links: ['https://scholar.google.com/'] },
            ]
        },
    ],
    GENERAL: [
        {
            title: 'Study Skills & Learning Strategies', desc: 'Learn how to learn effectively.', level: 'BEGINNER', tags: ['study-skills', 'learning'],
            lessons: [
                { title: 'Active Recall', desc: 'Testing yourself', body: 'Active recall—retrieving information from memory—is far more effective than passive re-reading.', links: ['https://www.learningscientists.org/retrieval-practice'] },
                { title: 'Spaced Repetition', desc: 'Timing your reviews', body: 'Spaced repetition schedules reviews at increasing intervals to optimize long-term memory retention.', links: ['https://ncase.me/remember/'] },
                { title: 'Note-Taking Methods', desc: 'Cornell, mind maps, outlines', body: 'The Cornell method divides the page into notes, cues, and summary. Mind maps show relationships visually.', links: ['https://learningcenter.unc.edu/tips-and-tools/effective-note-taking-in-class/'] },
            ]
        },
        {
            title: 'Critical Thinking', desc: 'Analyze arguments and avoid fallacies.', level: 'BEGINNER', tags: ['critical-thinking', 'logic'],
            lessons: [
                { title: 'What is Critical Thinking?', desc: 'Objective analysis', body: 'Critical thinking is the ability to analyze information objectively, evaluate arguments, and form reasoned judgments.', links: ['https://www.criticalthinking.org/'] },
                { title: 'Logical Fallacies', desc: 'Common reasoning errors', body: 'Fallacies are errors in reasoning: ad hominem, straw man, false dilemma, slippery slope, appeal to authority.', links: ['https://yourlogicalfallacyis.com/'] },
                { title: 'Evaluating Sources', desc: 'Distinguishing fact from fiction', body: 'Check sources using the CRAAP test: Currency, Relevance, Authority, Accuracy, Purpose.', links: ['https://guides.lib.unc.edu/evaluating-information'] },
            ]
        },
        {
            title: 'Digital Literacy', desc: 'Navigate the digital world safely.', level: 'BEGINNER', tags: ['digital-literacy', 'internet-safety'],
            lessons: [
                { title: 'Internet Safety', desc: 'Protecting yourself online', body: 'Use strong passwords, enable 2FA, recognize phishing attempts, and be careful with personal information.', links: ['https://staysafeonline.org/'] },
                { title: 'Information Literacy', desc: 'Finding reliable information', body: 'Evaluate online information critically. Check multiple sources, look for primary sources, verify claims.', links: ['https://www.ala.org/advocacy/intfreedom/iftoolkits/litoolkit'] },
                { title: 'Digital Footprint', desc: 'Your online presence', body: 'Everything you post online creates a digital footprint. Manage your presence carefully and think before sharing.', links: ['https://www.internetsociety.org/tutorials/your-digital-footprint-matters/'] },
            ]
        },
        {
            title: 'Time Management', desc: 'Organize your time effectively.', level: 'BEGINNER', tags: ['productivity', 'time-management'],
            lessons: [
                { title: 'Setting SMART Goals', desc: 'Specific, Measurable, Achievable', body: 'SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. They provide clear direction.', links: ['https://www.mindtools.com/a4wo118/smart-goals'] },
                { title: 'The Pomodoro Technique', desc: '25 minutes of focused work', body: 'Work in 25-minute focused intervals followed by 5-minute breaks. After 4 intervals, take a longer break.', links: ['https://todoist.com/productivity-methods/pomodoro-technique'] },
                { title: 'Prioritization with Eisenhower Matrix', desc: 'Urgent vs. important', body: 'Categorize tasks into 4 quadrants: urgent+important (do), important (schedule), urgent (delegate), neither (eliminate).', links: ['https://www.eisenhower.me/eisenhower-matrix/'] },
            ]
        },
        {
            title: 'Environmental Awareness', desc: 'Understanding climate change and sustainability.', level: 'BEGINNER', tags: ['environment', 'sustainability'],
            lessons: [
                { title: 'Climate Change Basics', desc: 'The science of global warming', body: 'Greenhouse gases trap heat in Earth\'s atmosphere. Human activities have increased CO₂ levels dramatically since industrialization.', links: ['https://climate.nasa.gov/'] },
                { title: 'Renewable Energy', desc: 'Solar, wind, hydro', body: 'Renewable sources—solar, wind, hydro, geothermal—provide clean energy alternatives to fossil fuels.', links: ['https://www.energy.gov/eere/renewable-energy'] },
                { title: 'Sustainable Living', desc: 'Reduce, reuse, recycle', body: 'Individual actions matter: reduce consumption, reuse items, recycle materials, conserve water and energy.', links: ['https://www.un.org/sustainabledevelopment/'] },
            ]
        },
    ],
};

const ARTICLES = [
    {
        title: 'The Future of Online Education: Trends for 2026',
        excerpt: 'Exploring how AI, VR, and personalized learning are reshaping education worldwide.',
        category: 'GENERAL',
        tags: ['education', 'technology', 'trends'],
        content: `# The Future of Online Education: Trends for 2026

Online education continues to evolve rapidly. Here are the key trends shaping learning in 2026:

## 1. AI-Powered Personalized Learning
Adaptive learning platforms use AI to tailor content to each student's pace, knowledge gaps, and learning style. This approach has shown up to 30% improvement in learning outcomes.

## 2. Virtual and Augmented Reality
VR classrooms and AR overlays bring abstract concepts to life. Imagine exploring the solar system in VR or dissecting a virtual frog.

## 3. Microlearning
Short, focused lessons (5-15 minutes) delivered on mobile devices fit busy schedules and improve retention through spaced repetition.

## 4. Open Educational Resources (OER)
The OER movement continues to grow, making quality education accessible to all. Platforms like MIT OpenCourseWare and Khan Academy lead the way.

## 5. Social Learning
Collaborative features—discussion forums, peer review, group projects—enhance engagement and deepen understanding through community.

## Resources
- [UNESCO on Online Education](https://www.unesco.org/en/digital-education)
- [MIT OpenCourseWare](https://ocw.mit.edu/)
- [Khan Academy](https://www.khanacademy.org/)`,
    },
    {
        title: 'Effective Study Techniques Backed by Science',
        excerpt: 'Research-proven methods to study smarter, not harder—from spaced repetition to interleaving.',
        category: 'GENERAL',
        tags: ['study-tips', 'science', 'learning'],
        content: `# Effective Study Techniques Backed by Science

Not all study methods are created equal. Here are techniques supported by cognitive science research:

## Active Recall
Instead of passively re-reading notes, test yourself. Flashcards, practice problems, and self-quizzing force your brain to retrieve information, strengthening neural pathways.

## Spaced Repetition
Review material at increasing intervals: 1 day → 3 days → 7 days → 14 days → 30 days. This combats the forgetting curve identified by Hermann Ebbinghaus.

## Interleaving
Mix different topics or problem types during study sessions rather than blocking. This improves your ability to discriminate between concepts.

## Elaborative Interrogation
Ask "why?" and "how?" as you study. Connecting new material to existing knowledge creates stronger memory traces.

## The Feynman Technique
1. Choose a concept
2. Explain it simply, as if teaching a child
3. Identify gaps in your explanation
4. Go back and fill those gaps

## Resources
- [The Learning Scientists](https://www.learningscientists.org/)
- [Make It Stick (Book)](https://www.retrievalpractice.org/make-it-stick)
- [Anki Spaced Repetition](https://apps.ankiweb.net/)`,
    },
    {
        title: 'Introduction to Open Source: Why It Matters for Students',
        excerpt: 'How open-source software and communities can accelerate your learning and career.',
        category: 'COMPUTER_SCIENCE',
        tags: ['open-source', 'programming', 'community'],
        content: `# Introduction to Open Source: Why It Matters for Students

Open source is more than free software—it's a philosophy of collaboration, transparency, and shared knowledge.

## What is Open Source?
Open-source software has publicly available source code that anyone can inspect, modify, and distribute. Examples: Linux, Firefox, Python, VS Code.

## Why Contribute?
- **Learn by doing**: Read real-world codebases and contribute fixes
- **Build your portfolio**: Contributions are visible on GitHub
- **Join a community**: Collaborate with developers worldwide
- **Career advancement**: Many employers value open-source contributions

## Getting Started
1. **Find a project**: Look for "good first issue" labels on GitHub
2. **Read the docs**: Every project has contribution guidelines
3. **Start small**: Fix typos, improve documentation, then tackle bugs
4. **Be respectful**: Follow codes of conduct and be patient

## Key Platforms
- [GitHub](https://github.com/)
- [GitLab](https://gitlab.com/)
- [First Contributions](https://firstcontributions.github.io/)
- [Up For Grabs](https://up-for-grabs.net/)

## Open Source in Education
Projects like OpenStax, Khan Academy, and MIT OCW demonstrate how open principles can democratize education globally.

## Resources
- [Open Source Guide](https://opensource.guide/)
- [GitHub Student Developer Pack](https://education.github.com/pack)
- [The Open Source Initiative](https://opensource.org/)`,
    },
];

// ─── Helpers for JSON file output ───
function ensureDir(dir: string) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function nextIndex(dir: string): number {
    ensureDir(dir);
    const files = readdirSync(dir).filter((f: string) => f.endsWith('.json'));
    return files.length + 1;
}

function writeJson(dir: string, name: string, data: Record<string, unknown>) {
    ensureDir(dir);
    const filepath = join(dir, `${name}.json`);
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    return filepath;
}

async function main() {
    console.log('🌱 Starting seed...');

    // Output directories
    const articlesDir = join(ROOT, 'articles');
    const lessonsDir = join(ROOT, 'lessons');

    // Create default school
    const school = await prisma.school.upsert({
        where: { slug: 'tudor-vianu' },
        update: {},
        create: {
            name: 'Colegiul Național de Informatică Tudor Vianu',
            slug: 'tudor-vianu',
            address: 'Str. Arh. Ion Mincu, Nr. 10, Sector 1, București',
            phone: '021-222-66-70',
            email: 'lbi@lbi.ro',
            website: 'https://portal.lbi.ro',
            description: 'Colegiul Național de Informatică Tudor Vianu - Centru de excelență în educație informatică',
        },
    });

    console.log(`🏫 School: ${school.name} (${school.id})`);

    // Ensure we have an admin/principal user
    const hashedPw = await bcrypt.hash('SeedAdmin123!', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'seed-admin@viitor-educat.ro' },
        update: {},
        create: {
            email: 'seed-admin@viitor-educat.ro',
            password: hashedPw,
            role: 'ADMIN',
        },
    });

    await prisma.principal.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
            userId: admin.id,
            schoolId: school.id,
            title: 'Director',
            isPrimary: true,
        },
    });

    console.log(`👑 Principal: ${admin.email} (${admin.id})`);

    // Create default settings for admin
    await prisma.userSettings.upsert({
        where: { userId: admin.id },
        update: {},
        create: { userId: admin.id }
    });

    // Ensure we have a teacher user
    const hashedPwTeacher = await bcrypt.hash('SeedTeacher123!', 12);
    const teacher = await prisma.user.upsert({
        where: { email: 'seed-teacher@viitor-educat.ro' },
        update: {},
        create: {
            email: 'seed-teacher@viitor-educat.ro',
            password: hashedPwTeacher,
            role: 'TEACHER',
        },
    });

    await prisma.teacherProfile.upsert({
        where: { userId: teacher.id },
        update: {},
        create: {
            userId: teacher.id,
            schoolId: school.id,
            bio: 'Open-source educator passionate about making quality education accessible to everyone.',
            website: 'https://github.com/viitor-educat',
        },
    });

    // Create default settings for teacher
    await prisma.userSettings.upsert({
        where: { userId: teacher.id },
        update: {},
        create: { userId: teacher.id }
    });

    console.log(`👨‍🏫 Teacher: ${teacher.email} (${teacher.id})`);

    // Seed lessons from existing JSON files
    const jsonLessonCount = await seedLessonsFromJson(prisma, teacher.id);
    if (jsonLessonCount > 0) {
        console.log(`📚 Seeded ${jsonLessonCount} lessons from JSON files`);
    }

    // Ensure we have a student user
    const hashedPwStudent = await bcrypt.hash('SeedStudent123!', 12);
    const student = await prisma.user.upsert({
        where: { email: 'seed-student@viitor-educat.ro' },
        update: {},
        create: {
            email: 'seed-student@viitor-educat.ro',
            password: hashedPwStudent,
            role: 'STUDENT',
        },
    });

    await prisma.studentProfile.upsert({
        where: { userId: student.id },
        update: {},
        create: {
            userId: student.id,
            schoolId: school.id,
            grade: 10,
            section: 'A',
            bio: 'Curious learner passionate about technology and science.',
        },
    });

    // Create default settings for student
    await prisma.userSettings.upsert({
        where: { userId: student.id },
        update: {},
        create: { userId: student.id }
    });

    console.log(`🎓 Student: ${student.email} (${student.id})`);

    // Create courses + write lesson JSON files
    let courseCount = 0;
    let lessonCount = 0;
    let lessonFileCount = 0;

    for (const [category, courses] of Object.entries(COURSES)) {
        for (const c of courses) {
            const s = slug(c.title);
            const course = await prisma.course.create({
                data: {
                    title: c.title,
                    slug: s,
                    description: c.desc,
                    level: c.level as any,
                    category,
                    tags: c.tags,
                    teacherId: teacher.id,
                    status: 'PUBLISHED',
                    published: true,
                    lessons: {
                        create: c.lessons.map((l, i) => ({
                            title: l.title,
                            description: l.desc,
                            content: md(l.title, l.body, l.links),
                            status: 'PUBLIC',
                            order: i,
                            teacherId: teacher.id,
                        })),
                    },
                },
                include: { lessons: { orderBy: { order: 'asc' } } },
            });
            // Set published=true via raw SQL (column exists in DB but not in Prisma schema)
            await prisma.$executeRawUnsafe(`UPDATE "Course" SET published = true WHERE id = $1`, course.id);

            // Write each lesson to JSON in the appropriate folder
            // PUBLIC/PUBLISHED = free, PRIVATE/DRAFT = paid
            for (const lesson of course.lessons) {
                const isPaid = lesson.status === 'PRIVATE' || lesson.status === 'DRAFT';
                const tier = isPaid ? 'paid' : 'free';
                const lessonDir = join(lessonsDir, tier, category.toLowerCase());
                const idx = nextIndex(lessonDir);
                const safeName = `${String(idx).padStart(3, '0')}-${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`;
                writeJson(lessonDir, safeName, {
                    id: lesson.id,
                    courseId: course.id,
                    courseTitle: c.title,
                    title: lesson.title,
                    description: lesson.description,
                    content: lesson.content,
                    order: lesson.order,
                    status: lesson.status,
                    tier,
                    category,
                    links: c.lessons[lesson.order]?.links || [],
                    createdAt: lesson.createdAt,
                });
                lessonFileCount++;
            }

            courseCount++;
            lessonCount += c.lessons.length;
            console.log(`  📚 [${category}] ${c.title} (${c.lessons.length} lessons)`);
        }
    }

    // Create articles in DB + write JSON files
    let articleFileCount = 0;
    for (const a of ARTICLES) {
        const s = slug(a.title);
        const article = await prisma.article.create({
            data: {
                title: a.title,
                slug: s,
                content: a.content,
                excerpt: a.excerpt,
                category: a.category as any,
                tags: a.tags,
                authorId: teacher.id,
                status: 'PUBLISHED',
            },
        });

        // Write article to JSON in articles/{category}/
        const categoryDir = join(articlesDir, a.category.toLowerCase());
        const idx = nextIndex(categoryDir);
        const safeName = `${String(idx).padStart(3, '0')}-${a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`;
        writeJson(categoryDir, safeName, {
            id: article.id,
            title: a.title,
            slug: s,
            excerpt: a.excerpt,
            category: a.category,
            tags: a.tags,
            content: a.content,
            status: 'PUBLISHED',
            authorId: teacher.id,
            createdAt: article.createdAt,
        });
        articleFileCount++;

        console.log(`  📰 Article: ${a.title}`);
    }

    console.log(`\n✅ Seed complete!`);
    console.log(`   ${courseCount} courses, ${lessonCount} lessons, ${ARTICLES.length} articles`);
    console.log(`   📁 ${lessonFileCount} lesson JSON files written to ${lessonsDir}`);
    console.log(`   📁 ${articleFileCount} article JSON files written to ${articlesDir}`);
}

// Seed lessons from existing JSON files in backend/lessons/free/
async function seedLessonsFromJson(prisma: PrismaClient, teacherId: string) {
    const subjects = ['math', 'science', 'history', 'arts', 'literature', 'languages', 'computer_science', 'general'];
    const lessonsDir = join(ROOT, 'lessons', 'free');
    let seededCount = 0;

    for (const subject of subjects) {
        const subjectDir = join(lessonsDir, subject);
        if (!existsSync(subjectDir)) {
            console.log(`⚠️  Directory not found: ${subjectDir}`);
            continue;
        }

        const files = readdirSync(subjectDir).filter(f => f.endsWith('.json'));
        console.log(`📂 Processing ${subject}: ${files.length} files`);

        for (const file of files) {
            try {
                const raw = JSON.parse(readFileSync(join(subjectDir, file), 'utf-8'));
                
                await prisma.lesson.upsert({
                    where: { id: raw.id },
                    update: {
                        title: raw.title,
                        content: raw.content,
                        description: raw.description,
                        status: 'PUBLIC',
                        order: parseInt(file.split('-')[0]) || 0,
                    },
                    create: {
                        id: raw.id,
                        title: raw.title,
                        content: raw.content,
                        description: raw.description,
                        status: 'PUBLIC',
                        teacherId: teacherId,
                        order: parseInt(file.split('-')[0]) || 0,
                    },
                });
                seededCount++;
            } catch (err) {
                console.error(`  ❌ Failed to seed ${file}:`, err);
            }
        }
    }

    return seededCount;
}

main()
    .catch((e) => { console.error('Seed error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
