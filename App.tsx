import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Project, Website, Article, AppConfig } from './types';
import { fetchArticles } from './services/rssService';
import { fetchConfig, fetchExternalData } from './services/configService';
import { applySeoConfig } from './services/seoService';
import { useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProjectCard from './components/ProjectCard';
import WebsiteCard from './components/WebsiteCard';
import ArticleCard from './components/ArticleCard';
import Website3DCarousel from './components/Website3DCarousel';
import { 
  Github, Linkedin, Mail, Twitter, ArrowRight, Facebook, Instagram, Youtube, 
  Gitlab, Code, Terminal, Cpu, Coffee, Globe, Rss, Link as LinkIcon 
} from 'lucide-react';

// 将配置中的社交平台标识映射到 lucide 图标组件，便于统一渲染
const iconMap: Record<string, React.FC<any>> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  mail: Mail,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  gitlab: Gitlab,
  globe: Globe,
  code: Code,
  terminal: Terminal,
  cpu: Cpu,
  coffee: Coffee,
  rss: Rss
};

const projectsSectionCopy = {
  title: '我的项目',
  description: '这里放了一些最近我在捣鼓的项目，都非常的有趣，欢迎常来逛逛！'
};

const websitesSectionCopy = {
  title: '我的网站',
  description: '这些是我部署的网站，各种功能应有尽有，欢迎来试试！总有一个能帮到你！'
};

const articlesSectionCopy = {
  title: '最新文章',
  description: '除了敲代码，我还喜欢写关于生活和技术的文章。这里有我最近的一些文章，欢迎阅读！'
};

const getSocialIcon = (iconName: string) => {
  const LucideIcon = iconMap[iconName.toLowerCase()];
  if (LucideIcon) {
    return <LucideIcon size={20} />;
  }
  // 若配置使用自定义 iconfont 类名，则回退到原生 <i> 以继续展示
  return <i className={iconName} style={{ fontSize: '20px' }}></i>;
};

interface HomePageProps {
  articles: Article[];
  config: AppConfig;
  projects: Project[];
  websites: Website[];
  loading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ articles, config, projects, websites, loading }) => {
  const isProjectCountOdd = projects.length % 2 !== 0;
  const profileTagline = config.profile.tagline || `${config.profile.title}. ${config.profile.description}`;

  return (
    <div className="space-y-24 pb-20">
      <section className="relative py-20 lg:py-32 overflow-hidden border-slate-200/40 dark:border-slate-800/40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-8 inline-block relative">
             <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/50 dark:border-slate-800/50 shadow-2xl mx-auto backdrop-blur-sm">
               <img src={config.profile.avatar} alt="Profile" className="w-full h-full object-cover" />
             </div>
             <div className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full shadow-lg"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 drop-shadow-sm">
            Hello, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{config.profile.name}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 font-medium">
             {profileTagline}
          </p>
          <div className="flex justify-center gap-4">
            {config.profile.social.map((item, idx) => (
              <a 
                key={idx} 
                href={item.url} 
                target="_blank" 
                rel="noreferrer" 
                className="p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 hover:scale-110 hover:shadow-lg transition-all duration-300 flex items-center justify-center min-w-[48px] min-h-[48px]"
                aria-label={item.platform}
              >
                {getSocialIcon(item.icon)}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

        {projects.length > 0 && (
          <section>
            {isProjectCountOdd ? (
              <>
                <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center mb-10 md:mb-12">
                   <div className="h-full order-2 md:order-1">
                      <ProjectCard project={projects[0]} />
                   </div>
                   <div className="flex flex-col justify-center space-y-6 order-1 md:order-2">
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{projectsSectionCopy.title}</h2>
                     <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                       {projectsSectionCopy.description}
                     </p>
                     <a href="#/projects" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:underline hover:text-blue-700 transition-colors">
                       View all projects <ArrowRight size={16} className="ml-2" />
                     </a>
                   </div>
                </div>
                {projects.length > 1 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {projects.slice(1).map(p => <ProjectCard key={p.id} project={p} />)}
                   </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">{projectsSectionCopy.title}</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                      {projectsSectionCopy.description}
                    </p>
                  </div>
                  <a href="#/projects" className="hidden md:inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:underline whitespace-nowrap mb-2">
                    View all projects <ArrowRight size={16} className="ml-2" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
                <div className="mt-6 md:hidden text-center">
                   <a href="#/projects" className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700">
                    View all projects <ArrowRight size={16} className="ml-1" />
                  </a>
                </div>
              </>
            )}
          </section>
        )}

        {websites.length > 0 && (
          <section className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-blue-400/10 blur-3xl rounded-full -z-10 opacity-50"></div>
            
            <div className="flex justify-between items-end mb-4 md:mb-8">
              <div>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{websitesSectionCopy.title}</h2>
                 <p className="text-slate-600 dark:text-slate-400 mt-1">{websitesSectionCopy.description}</p>
              </div>
              <a href="#/websites" className="hidden md:flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors hover:underline">
                View all websites <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
            
            <Website3DCarousel websites={websites} />

            <div className="mt-2 md:hidden text-center">
               <a href="#/websites" className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700">
                View all websites <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </section>
        )}

        <section>
          <div className="flex justify-between items-end mb-8">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{articlesSectionCopy.title}</h2>
          </div>
          {articles.length > 0 ? (
             <div className="flex flex-col gap-6">
                {articles.map((article) => (
                   <ArticleCard key={article.guid} article={article} />
                ))}
             </div>
          ) : (
            <div className="p-8 text-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
               {loading 
                ? 'Loading articles...' 
                : (config.site.rssUrl ? 'No articles found.' : 'No RSS feed configured.')}
            </div>
          )}
          <div className="mt-6 flex justify-end">
             <a href="#/articles" className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors hover:underline">
              Read more articles <ArrowRight size={16} className="ml-1" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

const ProjectsPage: React.FC<{ projects: Project[] }> = ({ projects }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="mb-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{projectsSectionCopy.title}</h1>
      <p className="text-slate-600 dark:text-slate-400">{projectsSectionCopy.description}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  </div>
);

const WebsitesPage: React.FC<{ websites: Website[] }> = ({ websites }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
     <div className="mb-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{websitesSectionCopy.title}</h1>
      <p className="text-slate-600 dark:text-slate-400">{websitesSectionCopy.description}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {websites.map(w => <WebsiteCard key={w.id} website={w} />)}
    </div>
  </div>
);

const ArticlesPage: React.FC<{ articles: Article[], loading: boolean }> = ({ articles, loading }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="mb-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{articlesSectionCopy.title}</h1>
      <p className="text-slate-600 dark:text-slate-400">{articlesSectionCopy.description}</p>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {loading ? (
        [1,2,3,4].map(i => <div key={i} className="h-48 bg-white/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>)
      ) : articles.length > 0 ? (
        articles.map(a => <ArticleCard key={a.guid} article={a} />)
      ) : (
        <div className="col-span-1 lg:col-span-2 text-center py-12 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl">
           No articles found.
        </div>
      )}
    </div>
  </div>
);

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const location = useLocation();
  const { setThemeConfig } = useTheme();

  useEffect(() => {
    // 首次挂载时：加载配置、拉取外部数据源、应用 SEO 和主题，并动态注入站点资源
    const initData = async () => {
      try {
        const conf = await fetchConfig();
        setConfig(conf);
        applySeoConfig(conf);

        if (conf.theme) setThemeConfig(conf.theme);

        if (conf.dataSources?.projects) {
          const projData = await fetchExternalData<Project>(conf.dataSources.projects);
          setProjects(projData);
        }

        if (conf.dataSources?.websites) {
          const webData = await fetchExternalData<Website>(conf.dataSources.websites);
          setWebsites(webData);
        }

        if (conf.site.favicon) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = conf.site.favicon;
        }

        if (conf.site.iconFontUrl) {
          const id = 'custom-iconfont-css';
          if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = conf.site.iconFontUrl;
            document.head.appendChild(link);
          }
        }

        if (conf.site.rssUrl) {
           const data = await fetchArticles(conf.site.rssUrl);
           setArticles(data);
        }
      } catch (error) {
        console.error('Failed to load configuration:', error);
        setConfigError(error instanceof Error ? error.message : 'Configuration not found');
      } finally {
        setLoadingArticles(false);
      }
    };

    initData();
  }, [setThemeConfig]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-slate-500 dark:text-slate-400">Configuration not found: {configError}</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-slate-500 dark:text-slate-400 animate-pulse">Loading configuration...</div>
      </div>
    );
  }

  // 首页仅截取配置数量，避免一次性渲染过多卡片
  const homeProjects = projects.slice(0, config.display.projectCount);
  const homeWebsites = websites.slice(0, config.display.websiteCount);
  const homeArticles = articles.slice(0, config.display.articleCount);

  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
      <div className="fixed inset-0 -z-50 h-full w-full bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
         
         <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[-2] h-[60vh] w-[80vw] 
           bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.15),transparent_70%)] 
           dark:bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.15),transparent_70%)] 
           blur-[80px] rounded-full pointer-events-none" 
         />
         
         <div className="absolute bottom-0 right-0 z-[-2] h-[50vh] w-[50vw] 
           bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.15),transparent_70%)] 
           dark:bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.10),transparent_70%)] 
           blur-[100px] rounded-full pointer-events-none" 
         />

         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

         <div className="absolute inset-0 z-[-1] opacity-40 dark:opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: noiseBg }}></div>
      </div>

      <Navbar siteConfig={config.site} />
      
      <main className="flex-grow pt-24">
        <Routes>
          <Route path="/" element={
            <HomePage 
              articles={homeArticles} 
              config={config} 
              projects={homeProjects}
              websites={homeWebsites}
              loading={loadingArticles}
            />
          } />
          <Route path="/projects" element={<ProjectsPage projects={projects} />} />
          <Route path="/websites" element={<WebsitesPage websites={websites} />} />
          <Route path="/articles" element={<ArticlesPage articles={articles} loading={loadingArticles} />} />
        </Routes>
      </main>

      <footer className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 py-8 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-slate-500 dark:text-slate-400 text-sm">
             <span>&copy; {new Date().getFullYear()} {config.footer.owner}. All rights reserved.</span>
             {config.footer.icp && (
               <a 
                href="https://beian.miit.gov.cn/" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
               >
                 {config.footer.icp}
               </a>
             )}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm flex flex-wrap justify-center gap-4">
             {config.footer.links?.map((link, idx) => (
                link.url ? (
                  <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium">
                    {link.text}
                  </a>
                ) : (
                  <span key={idx}>{link.text}</span>
                )
             ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
