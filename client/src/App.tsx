import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, Atom, Bell, Bookmark, BookOpen, ChevronLeft, ChevronRight, Command, Compass, FlaskConical,
  FolderKanban, Globe2, GraduationCap, HeartPulse, House, LayoutDashboard, Library, Menu, Orbit, Search,
  Settings, Sigma, Sparkles, Telescope, Users, Wrench, X, FileSearch, Newspaper, type LucideIcon,
} from "lucide-react";
import { NAV_ENTRIES, SCIENCE_TOPICS, type NavEntry } from "./data/catalog";
import { readLocal, writeLocal } from "./lib/storage";
import {
  AiPage, BiologyPage, ChemistryPage, CommunityPage, DashboardPage, EarthPage, EngineeringPage, ExplorePage,
  HomePage, LabsPage, LearningPage, LibraryPage, MathPage, NewsPage, PhysicsPage, ProjectsPage, ResearchPage,
  SettingsPage, SimulationsPage, SpacePage,
} from "./features/ScientificPages";

const ICONS: Record<string, LucideIcon> = {
  house: House, sparkles: Sparkles, compass: Compass, flask: FlaskConical, orbit: Orbit, telescope: Telescope,
  heart: HeartPulse, atom: Atom, activity: Activity, sigma: Sigma, globe: Globe2, wrench: Wrench,
  "file-search": FileSearch, sparkle: Sparkles, newspaper: Newspaper, graduation: GraduationCap,
  folder: FolderKanban, library: Library, users: Users, layout: LayoutDashboard, settings: Settings,
};
const navGroups = [...new Set(NAV_ENTRIES.map((item) => item.group))];
const pageDescription = (entry: NavEntry) => `${entry.title} — ${entry.description} NOVA: Explore Beyond What You Know.`;

function setPageMetadata(title: string, description: string, route: string) {
  const brandedTitle = route === "/" ? title : `${title} · NOVA`;
  document.title = brandedTitle;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.content = description;
  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = brandedTitle;
  const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = description;

}

function PageMeta({ title, description }: { title: string; description: string }) {
  const location = useLocation();
  useEffect(() => { setPageMetadata(title, description, location.pathname); }, [title, description, location.pathname]);
  return null;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className={`brand ${compact ? "brandCompact" : ""}`} to="/" aria-label="NOVA home"><img src="/nova-mark.svg" alt=""/><span><strong>NOVA</strong>{!compact && <small>SCIENCE, UNBOUND</small>}</span></Link>;
}

function SideNavigation({ collapsed, onToggle, mobileOpen, onClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  return <>
    {mobileOpen && <button className="mobileScrim" aria-label="Close navigation" onClick={onClose}/>}
    <aside className={`sideNav ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobileOpen" : ""}`}>
      <div className="navBrand"><Brand compact={collapsed}/><button className="navCollapse" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button><button className="navMobileClose" onClick={onClose} aria-label="Close menu"><X size={18}/></button></div>
      <div className="navScroll">{navGroups.map(group => <section className="navGroup" key={group}><div className="navGroupTitle">{collapsed ? <span/> : group}</div>{NAV_ENTRIES.filter(entry=>entry.group===group).map(entry=>{const Icon=ICONS[entry.icon]??Compass;const active=entry.path==="/"?location.pathname==="/":location.pathname===entry.path||location.pathname.startsWith(`${entry.path}/`);return <Link key={entry.path} to={entry.path} title={collapsed?entry.title:undefined} aria-current={active?"page":undefined} className={`navItem ${active?"active":""}`} onClick={onClose}><span className="navIcon"><Icon size={17} strokeWidth={active?2:1.7}/></span><span className="navText">{entry.shortTitle}</span>{active&&!collapsed&&<i className="navActiveMark"/>}</Link>})}</section>)}</div>
      {!collapsed&&<div className="navFooter"><div className="focusLine"><span/><div><strong>SPACE FOR CURIOSITY</strong><small>A model is a lens, not the whole universe.</small></div></div><p>© NOVA · Explore beyond what you know</p></div>}
      {collapsed&&<button className="sidebarExpandHint" onClick={onToggle} title="Expand navigation"><ChevronRight size={17}/></button>}
    </aside>
  </>;
}

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const navigate=useNavigate();const [value,setValue]=useState("");const [active,setActive]=useState(0);
  const results=useMemo(()=>{const q=value.trim().toLowerCase();if(!q)return NAV_ENTRIES.slice(0,6).map(item=>({title:item.title,subtitle:item.description,path:item.path,kind:"DESTINATION"}));const pages=NAV_ENTRIES.filter(item=>`${item.title} ${item.description} ${item.group}`.toLowerCase().includes(q)).map(item=>({title:item.title,subtitle:item.description,path:item.path,kind:"DESTINATION"}));const topics=SCIENCE_TOPICS.filter(item=>`${item.title} ${item.description} ${item.subject}`.toLowerCase().includes(q)).slice(0,7).map(item=>({title:item.title,subtitle:`${item.subject} · ${item.description}`,path:`/explore?topic=${encodeURIComponent(item.id)}`,kind:"CONCEPT"}));return [...pages,...topics].slice(0,10)},[value]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();if(e.key==="ArrowDown"){e.preventDefault();setActive(i=>Math.min(i+1,results.length-1))}if(e.key==="ArrowUp"){e.preventDefault();setActive(i=>Math.max(0,i-1))}if(e.key==="Enter"&&results[active]){navigate(results[active]!.path);onClose()}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[onClose,results,active,navigate]);
  useEffect(()=>{document.querySelector<HTMLInputElement>(".globalSearchInput")?.focus()},[]);
  return <div className="searchOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="searchDialog"><div className="searchDialogInput"><Search size={19}/><input className="globalSearchInput" value={value} onChange={e=>{setValue(e.target.value);setActive(0)}} placeholder="Search science, tools and ideas…"/><kbd>ESC</kbd><button onClick={onClose} aria-label="Close search"><X size={16}/></button></div><div className="searchResults"><div className="searchResultLabel">{value?"MATCHING DESTINATIONS & CONCEPTS":"QUICK ACCESS"}</div>{results.length?results.map((result,i)=><button className={`searchResult ${active===i?"active":""}`} key={`${result.kind}${result.path}${i}`} onMouseEnter={()=>setActive(i)} onClick={()=>{navigate(result.path);onClose()}}><span className="searchResultIcon">{result.kind==="CONCEPT"?<Atom size={16}/>:<Compass size={16}/>}</span><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><label>{result.kind}</label><ChevronRight size={15}/></button>):<div className="searchNoResults">No matching topic or destination. Try another search term.</div>}</div><div className="searchDialogFoot"><span><kbd>↑↓</kbd> Navigate</span><span><kbd>↵</kbd> Open result</span><span><Command size={12}/> Source-aware science workspace</span></div></div></div>;
}

function TopBar({ onSearch, onMenu, collapsed }: { onSearch: () => void; onMenu: () => void; collapsed: boolean }) {
  const location=useLocation();const [theme,setTheme]=useState(()=>readLocal("theme","dark"));const [notifications,setNotifications]=useState(false);const entry=NAV_ENTRIES.find(item=>item.path===location.pathname);const title=entry?.title??"Science Explorer";
  useEffect(()=>{const onTheme=()=>setTheme(readLocal("theme","dark"));window.addEventListener("storage",onTheme);return()=>window.removeEventListener("storage",onTheme)},[]);
  const toggleTheme=()=>{const next=theme==="dark"?"light":"dark";setTheme(next);document.documentElement.dataset.theme=next;writeLocal("theme",next)};
  return <header className="topBar"><button className="topMenuButton" aria-label="Open menu" onClick={onMenu}><Menu size={19}/></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{title}</strong></div><button className="topSearch" onClick={onSearch}><Search size={15}/><span>Search the universe…</span><kbd>/</kbd><kbd className="cmdKey">⌘ K</kbd></button><div className="topActions"><button className="iconButton themeToggle" onClick={toggleTheme} title={`Switch to ${theme==="dark"?"light":"dark"} theme`}>{theme==="dark"?"☼":"◐"}</button><div className="notificationWrap"><button className={`iconButton ${notifications?"selected":""}`} onClick={()=>setNotifications(!notifications)} title="Notification preferences"><Bell size={16}/></button>{notifications&&<div className="notificationPopover"><strong>Your observatory is quiet.</strong><p>Push notifications are not enabled. Manage your local preference in Settings.</p><Link to="/settings" onClick={()=>setNotifications(false)}>Open settings <ChevronRight size={13}/></Link></div>}</div><Link className="profileButton" to="/dashboard"><span className="profileAvatar">N</span><span>My workspace</span><ChevronRight size={14}/></Link></div></header>;
}

function FloatingAi(){const location=useLocation();if(location.pathname==="/ai")return null;return <Link className="floatingAi" to="/ai" aria-label="Open NOVA AI"><Sparkles size={17}/><span>Ask NOVA</span></Link>}
function MobileBottomNav(){const location=useLocation();const items=[NAV_ENTRIES[0]!,NAV_ENTRIES[2]!,NAV_ENTRIES[5]!,NAV_ENTRIES[15]!,NAV_ENTRIES[19]!];return <nav className="mobileBottomNav" aria-label="Primary mobile navigation">{items.map(item=>{const Icon=ICONS[item.icon]??Compass;return <Link key={item.path} to={item.path} className={location.pathname===item.path?"active":""}><Icon size={17}/><span>{item.shortTitle}</span></Link>})}</nav>}
function FloatingKeyHelp(){return null}
function RoutedPages(){const location=useLocation();const navigate=useNavigate();const props={navigate,query:new URLSearchParams(location.search).get("q")??""};const entry=NAV_ENTRIES.find(item=>item.path===location.pathname);const description=entry?pageDescription(entry):"Explore a source-cited science lesson or project in NOVA.";const title=location.pathname==="/"?"NOVA — Explore Beyond What You Know":entry?.title??(location.pathname.startsWith("/discoveries/")?"Discoveries":location.pathname.startsWith("/news/")?"Science News":location.pathname.startsWith("/learn/")?"Science Lesson":location.pathname.startsWith("/research/")?"Research Note":location.pathname.startsWith("/projects/")?"Project Workspace":location.pathname.startsWith("/library/")?"Knowledge Library":"Page not found");
  return <><PageMeta title={title} description={description}/><Routes>
    <Route path="/" element={<HomePage {...props}/>}/><Route path="/ai" element={<AiPage {...props}/>}/><Route path="/explore" element={<ExplorePage {...props}/>}/><Route path="/labs" element={<LabsPage {...props}/>}/><Route path="/simulations" element={<SimulationsPage {...props}/>}/><Route path="/space" element={<SpacePage/>}/><Route path="/biology" element={<BiologyPage/>}/><Route path="/chemistry" element={<ChemistryPage/>}/><Route path="/physics" element={<PhysicsPage/>}/><Route path="/math" element={<MathPage/>}/><Route path="/earth" element={<EarthPage {...props}/>}/><Route path="/engineering" element={<EngineeringPage/>}/><Route path="/research" element={<ResearchPage/>}/><Route path="/discoveries" element={<NewsPage {...props}/>}/><Route path="/news" element={<NewsPage {...props}/>}/><Route path="/learn" element={<LearningPage {...props}/>}/><Route path="/projects" element={<ProjectsPage/>}/><Route path="/library" element={<LibraryPage {...props}/>}/><Route path="/community" element={<CommunityPage/>}/><Route path="/dashboard" element={<DashboardPage {...props}/>}/><Route path="/settings" element={<SettingsPage {...props}/>}/><Route path="/learn/:slug" element={<LearningPage {...props}/>}/><Route path="/discoveries/:slug" element={<NewsPage {...props}/>}/><Route path="/news/:slug" element={<NewsPage {...props}/>}/><Route path="/research/:id" element={<ResearchPage/>}/><Route path="/projects/:id" element={<ProjectsPage/>}/><Route path="/library/:slug" element={<LibraryPage {...props}/>}/><Route path="*" element={<div className="pageStack"><div className="pageHeader"><div><div className="eyebrow"><span className="eyebrowDot"/>NOVA · ROUTE NOT FOUND</div><h1>This page isn’t in the field guide.</h1><p>The requested path does not match a NOVA science page. Return to the research home and choose a valid destination.</p><a className="button button-primary" href="/">Return to NOVA</a></div></div></div>}/>
  </Routes></>;
}

export function App(){const [collapsed,setCollapsed]=useState(()=>readLocal("sidebarCollapsed",false));const [mobileOpen,setMobileOpen]=useState(false);const [search,setSearch]=useState(false);const location=useLocation();useEffect(()=>{const toggleSearch=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setSearch(true)}if(event.key==="/"&&!/input|textarea/i.test((event.target as HTMLElement).tagName)){event.preventDefault();setSearch(true)}};window.addEventListener("keydown",toggleSearch);return()=>window.removeEventListener("keydown",toggleSearch)},[]);useEffect(()=>{setMobileOpen(false)},[location.pathname]);const onToggle=()=>setCollapsed(v=>{writeLocal("sidebarCollapsed",!v);return !v});return <div className={`novaApp ${collapsed?"isCollapsed":""}`}><SideNavigation collapsed={collapsed} onToggle={onToggle} mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}/><main className="appMain"><TopBar collapsed={collapsed} onSearch={()=>setSearch(true)} onMenu={()=>setMobileOpen(true)}/><div className="pageCanvas"><RoutedPages/></div><footer className="appFooter"><span>NOVA <i/> Explore Beyond What You Know.</span><span>Science, with its assumptions in view.</span><button onClick={()=>document.querySelector(".pageCanvas")?.scrollTo({top:0,behavior:"smooth"})}>Back to top ↑</button></footer></main><FloatingAi/><MobileBottomNav/>{search&&<GlobalSearch onClose={()=>setSearch(false)}/>}</div>}

export default App;
