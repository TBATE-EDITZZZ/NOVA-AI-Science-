export type Subject = "Physics" | "Chemistry" | "Biology" | "Mathematics" | "Earth Science" | "Space" | "Engineering";

export interface ScienceTopic {
  id: string;
  title: string;
  subject: Subject;
  description: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  sourceLabel: string;
  sourceUrl: string;
}

export interface NavEntry {
  path: string;
  title: string;
  shortTitle: string;
  group: string;
  description: string;
  icon: string;
}

export const NAV_ENTRIES: NavEntry[] = [
  { path: "/", title: "Home", shortTitle: "Home", group: "Workspace", description: "Your scientific workspace, recent activity and exploration paths.", icon: "house" },
  { path: "/ai", title: "NOVA AI", shortTitle: "NOVA AI", group: "Workspace", description: "Ask a science question and explore the evidence, assumptions and uncertainty.", icon: "sparkles" },
  { path: "/explore", title: "Science Explorer", shortTitle: "Explorer", group: "Workspace", description: "Explore physics, chemistry, biology, mathematics and Earth science.", icon: "compass" },
  { path: "/labs", title: "Virtual Laboratories", shortTitle: "Virtual Labs", group: "Laboratories", description: "Open interactive, clearly scoped digital science laboratories.", icon: "flask" },
  { path: "/simulations", title: "Scientific Simulations", shortTitle: "Simulations", group: "Laboratories", description: "Adjust a model, observe a response and compare experiments.", icon: "orbit" },
  { path: "/space", title: "Space Explorer", shortTitle: "Space", group: "Explore", description: "Explore the solar system and NASA astronomy imagery.", icon: "telescope" },
  { path: "/biology", title: "Human Biology", shortTitle: "Biology", group: "Laboratories", description: "Study cell structure, DNA and organ systems.", icon: "heart" },
  { path: "/chemistry", title: "Chemistry Lab", shortTitle: "Chemistry", group: "Laboratories", description: "Investigate the periodic table, equations and acid–base concepts.", icon: "atom" },
  { path: "/physics", title: "Physics Lab", shortTitle: "Physics", group: "Laboratories", description: "Model ideal projectile motion and related physical systems.", icon: "activity" },
  { path: "/math", title: "Mathematics Studio", shortTitle: "Mathematics", group: "Explore", description: "Calculate, graph and reference mathematical ideas.", icon: "sigma" },
  { path: "/earth", title: "Earth and Environment", shortTitle: "Earth & Environment", group: "Explore", description: "Explore Earth systems and environmental science.", icon: "globe" },
  { path: "/engineering", title: "Engineering Studio", shortTitle: "Engineering", group: "Explore", description: "Apply science to structures, systems and design decisions.", icon: "wrench" },
  { path: "/research", title: "Research Center", shortTitle: "Research", group: "Explore", description: "Search deposited scholarly metadata and keep a personal notebook.", icon: "file-search" },
  { path: "/discoveries", title: "Discoveries", shortTitle: "Discoveries", group: "Explore", description: "Follow source-linked scientific discoveries and imagery.", icon: "sparkle" },
  { path: "/news", title: "Scientific News", shortTitle: "Science News", group: "Explore", description: "Browse official news sources and current research records.", icon: "newspaper" },
  { path: "/learn", title: "Learning Center", shortTitle: "Learning", group: "Explore", description: "Choose a level, follow lessons and track your practice locally.", icon: "graduation" },
  { path: "/projects", title: "Projects", shortTitle: "Projects", group: "Workspace", description: "Organize research notes, experiments and science project work.", icon: "folder" },
  { path: "/library", title: "Knowledge Library", shortTitle: "Library", group: "Explore", description: "Search concepts, formulas and source-backed learning notes.", icon: "library" },
  { path: "/community", title: "Community", shortTitle: "Community", group: "Workspace", description: "Share learning questions and project ideas with other learners.", icon: "users" },
  { path: "/dashboard", title: "User Dashboard", shortTitle: "Dashboard", group: "Account", description: "Review saved work, learning progress and profile state.", icon: "layout" },
  { path: "/settings", title: "Settings", shortTitle: "Settings", group: "Account", description: "Manage display, language and data preferences.", icon: "settings" },
];

const OPENSTAX_PHYSICS = "https://openstax.org/details/books/university-physics-volume-1";
const OPENSTAX_BIOLOGY = "https://openstax.org/details/books/biology-2e";
const OPENSTAX_MATH = "https://openstax.org/details/books/calculus-volume-1";
const NASA_SOLAR = "https://science.nasa.gov/solar-system/";
const NASA_EARTH = "https://science.nasa.gov/earth/";
const PUBCHEM = "https://pubchem.ncbi.nlm.nih.gov/periodic-table/";

export const SCIENCE_TOPICS: ScienceTopic[] = [
  { id: "classical-mechanics", title: "Classical mechanics", subject: "Physics", description: "Motion, forces and energy in systems where classical models are useful.", level: "Foundation", sourceLabel: "OpenStax University Physics", sourceUrl: OPENSTAX_PHYSICS },
  { id: "quantum-physics", title: "Quantum physics", subject: "Physics", description: "A framework for describing microscopic systems and their measurable outcomes.", level: "Advanced", sourceLabel: "OpenStax University Physics", sourceUrl: OPENSTAX_PHYSICS },
  { id: "thermodynamics", title: "Thermodynamics", subject: "Physics", description: "Energy, heat, work and the macroscopic state of physical systems.", level: "Intermediate", sourceLabel: "OpenStax University Physics", sourceUrl: OPENSTAX_PHYSICS },
  { id: "electromagnetism", title: "Electromagnetism", subject: "Physics", description: "Electric and magnetic fields, charge, current and electromagnetic waves.", level: "Intermediate", sourceLabel: "OpenStax University Physics", sourceUrl: OPENSTAX_PHYSICS },
  { id: "optics", title: "Optics", subject: "Physics", description: "How light propagates, reflects, refracts and forms images.", level: "Foundation", sourceLabel: "OpenStax University Physics", sourceUrl: OPENSTAX_PHYSICS },
  { id: "relativity", title: "Relativity", subject: "Physics", description: "Space, time and gravity in special and general relativity.", level: "Advanced", sourceLabel: "OpenStax University Physics", sourceUrl: OPENSTAX_PHYSICS },
  { id: "nuclear-physics", title: "Nuclear physics", subject: "Physics", description: "Nuclei, radioactive decay and the interactions that bind nuclear matter.", level: "Advanced", sourceLabel: "OpenStax University Physics", sourceUrl: OPENSTAX_PHYSICS },
  { id: "particle-physics", title: "Particle physics", subject: "Physics", description: "Fundamental particles and the interactions described by the Standard Model.", level: "Advanced", sourceLabel: "CERN: The Standard Model", sourceUrl: "https://home.cern/science/physics/standard-model" },
  { id: "astrophysics", title: "Astrophysics", subject: "Physics", description: "Physical processes in stars, galaxies and the wider universe.", level: "Advanced", sourceLabel: "NASA Science", sourceUrl: NASA_SOLAR },
  { id: "organic-chemistry", title: "Organic chemistry", subject: "Chemistry", description: "Structures, properties and reactions of carbon-containing compounds.", level: "Intermediate", sourceLabel: "OpenStax Chemistry 2e", sourceUrl: "https://openstax.org/details/books/chemistry-2e" },
  { id: "inorganic-chemistry", title: "Inorganic chemistry", subject: "Chemistry", description: "Elements and compounds outside the traditional scope of organic chemistry.", level: "Intermediate", sourceLabel: "OpenStax Chemistry 2e", sourceUrl: "https://openstax.org/details/books/chemistry-2e" },
  { id: "physical-chemistry", title: "Physical chemistry", subject: "Chemistry", description: "The physical principles behind chemical energy, equilibrium and change.", level: "Advanced", sourceLabel: "OpenStax Chemistry 2e", sourceUrl: "https://openstax.org/details/books/chemistry-2e" },
  { id: "biochemistry", title: "Biochemistry", subject: "Chemistry", description: "Molecular structure and chemical processes in living systems.", level: "Intermediate", sourceLabel: "OpenStax Biology 2e", sourceUrl: OPENSTAX_BIOLOGY },
  { id: "chemical-bonding", title: "Chemical bonding", subject: "Chemistry", description: "How atoms interact to form bonds and molecular structures.", level: "Foundation", sourceLabel: "PubChem", sourceUrl: PUBCHEM },
  { id: "periodic-table", title: "Periodic table", subject: "Chemistry", description: "Explore elements by atomic number and position in the periodic table.", level: "Foundation", sourceLabel: "PubChem Periodic Table", sourceUrl: PUBCHEM },
  { id: "chemical-reactions", title: "Chemical reactions", subject: "Chemistry", description: "Representations of chemical change and conservation of atoms.", level: "Foundation", sourceLabel: "OpenStax Chemistry 2e", sourceUrl: "https://openstax.org/details/books/chemistry-2e" },
  { id: "molecular-structures", title: "Molecular structures", subject: "Chemistry", description: "Three-dimensional arrangements of atoms in molecules.", level: "Intermediate", sourceLabel: "PubChem", sourceUrl: PUBCHEM },
  { id: "cell-biology", title: "Cell biology", subject: "Biology", description: "Cell structure, membranes and the specialized roles of organelles.", level: "Foundation", sourceLabel: "OpenStax Biology 2e", sourceUrl: OPENSTAX_BIOLOGY },
  { id: "genetics", title: "Genetics", subject: "Biology", description: "How biological information is inherited and expressed.", level: "Intermediate", sourceLabel: "OpenStax Biology 2e", sourceUrl: OPENSTAX_BIOLOGY },
  { id: "evolution", title: "Evolution", subject: "Biology", description: "Population-level change over generations and the evidence supporting it.", level: "Intermediate", sourceLabel: "OpenStax Biology 2e", sourceUrl: OPENSTAX_BIOLOGY },
  { id: "microbiology", title: "Microbiology", subject: "Biology", description: "Microorganisms and their interactions with organisms and environments.", level: "Intermediate", sourceLabel: "OpenStax Biology 2e", sourceUrl: OPENSTAX_BIOLOGY },
  { id: "ecology", title: "Ecology", subject: "Biology", description: "Interactions among organisms and the environments they inhabit.", level: "Foundation", sourceLabel: "OpenStax Biology 2e", sourceUrl: OPENSTAX_BIOLOGY },
  { id: "human-anatomy", title: "Human anatomy", subject: "Biology", description: "The organization and structure of human body systems.", level: "Foundation", sourceLabel: "OpenStax Anatomy & Physiology", sourceUrl: "https://openstax.org/details/books/anatomy-and-physiology-2e" },
  { id: "neuroscience", title: "Neuroscience", subject: "Biology", description: "Nervous-system structure, signaling and the study of brain function.", level: "Advanced", sourceLabel: "OpenStax Anatomy & Physiology", sourceUrl: "https://openstax.org/details/books/anatomy-and-physiology-2e" },
  { id: "biotechnology", title: "Biotechnology", subject: "Biology", description: "Tools that use biological systems and organisms for research and application.", level: "Advanced", sourceLabel: "OpenStax Biology 2e", sourceUrl: OPENSTAX_BIOLOGY },
  { id: "algebra", title: "Algebra", subject: "Mathematics", description: "Symbols, relationships and transformations used to express quantities.", level: "Foundation", sourceLabel: "OpenStax Algebra and Trigonometry", sourceUrl: "https://openstax.org/details/books/algebra-and-trigonometry-2e" },
  { id: "geometry", title: "Geometry", subject: "Mathematics", description: "Shapes, spatial relationships and proofs.", level: "Foundation", sourceLabel: "OpenStax Algebra and Trigonometry", sourceUrl: "https://openstax.org/details/books/algebra-and-trigonometry-2e" },
  { id: "trigonometry", title: "Trigonometry", subject: "Mathematics", description: "Relationships among angles, lengths and periodic functions.", level: "Intermediate", sourceLabel: "OpenStax Algebra and Trigonometry", sourceUrl: "https://openstax.org/details/books/algebra-and-trigonometry-2e" },
  { id: "calculus", title: "Calculus", subject: "Mathematics", description: "Rates of change, accumulation, limits and their applications.", level: "Advanced", sourceLabel: "OpenStax Calculus Volume 1", sourceUrl: OPENSTAX_MATH },
  { id: "statistics", title: "Statistics", subject: "Mathematics", description: "Methods for describing data and reasoning about uncertainty.", level: "Intermediate", sourceLabel: "OpenStax Introductory Statistics", sourceUrl: "https://openstax.org/details/books/introductory-statistics" },
  { id: "probability", title: "Probability", subject: "Mathematics", description: "Quantifying possible outcomes and uncertainty in random processes.", level: "Intermediate", sourceLabel: "OpenStax Introductory Statistics", sourceUrl: "https://openstax.org/details/books/introductory-statistics" },
  { id: "number-theory", title: "Number theory", subject: "Mathematics", description: "Properties and relationships of integers and their structures.", level: "Advanced", sourceLabel: "OpenStax Algebra and Trigonometry", sourceUrl: "https://openstax.org/details/books/algebra-and-trigonometry-2e" },
  { id: "geology", title: "Geology", subject: "Earth Science", description: "Earth materials, structure and processes that shape the planet.", level: "Foundation", sourceLabel: "NASA Earth Observatory", sourceUrl: NASA_EARTH },
  { id: "meteorology", title: "Meteorology", subject: "Earth Science", description: "The atmosphere, weather processes and forecasting.", level: "Foundation", sourceLabel: "NASA Earth Observatory", sourceUrl: NASA_EARTH },
  { id: "oceanography", title: "Oceanography", subject: "Earth Science", description: "The physical, chemical and biological study of ocean systems.", level: "Intermediate", sourceLabel: "NASA Earth Observatory", sourceUrl: NASA_EARTH },
  { id: "climate-science", title: "Climate science", subject: "Earth Science", description: "The climate system and evidence for observed changes over time.", level: "Intermediate", sourceLabel: "NASA Climate Change", sourceUrl: "https://science.nasa.gov/climate-change/" },
  { id: "environmental-science", title: "Environmental science", subject: "Earth Science", description: "Relationships between natural systems and human activity.", level: "Intermediate", sourceLabel: "NASA Earth Observatory", sourceUrl: NASA_EARTH },
];

export const SUBJECTS: { name: Subject; count: number; hint: string; icon: string }[] = [
  { name: "Physics", count: 9, hint: "Fields, forces & motion", icon: "activity" },
  { name: "Chemistry", count: 8, hint: "Elements, bonds & reactions", icon: "atom" },
  { name: "Biology", count: 8, hint: "Cells, life & systems", icon: "heart" },
  { name: "Mathematics", count: 7, hint: "Patterns, proof & models", icon: "sigma" },
  { name: "Earth Science", count: 5, hint: "Planetary systems & climate", icon: "globe" },
];

export function routeForTopic(topicId: string): string {
  const topic = SCIENCE_TOPICS.find((item) => item.id === topicId);
  if (!topic) return "/explore";
  const base: Record<Subject, string> = {
    Physics: "/physics", Chemistry: "/chemistry", Biology: "/biology",
    Mathematics: "/math", "Earth Science": "/earth", Space: "/space", Engineering: "/engineering",
  };
  return `${base[topic.subject]}?topic=${encodeURIComponent(topic.id)}`;
}
