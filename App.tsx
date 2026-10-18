import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Project, Website, Article, AppConfig } from './types';
import { fetchArticles } from './services/rssService';
import { fetchConfig, fetchExternalData } from './services/configService';
import { applySeoConfig, applyCanonicalUrl } from './services/seoService';
import { useTheme } from './context/ThemeContext';
import { CopyProvider, resolveCopy, useCopy } from './context/CopyContext';
import Navbar from './components/Navbar';
import ProjectCard from './components/ProjectCard';
import WebsiteCard from './components/WebsiteCard';
import ArticleCard from './components/ArticleCard';
import Website3DCarousel, { useLakeDisabled } from './components/Website3DCarousel';
import AmbientBackground from './components/AmbientBackground';
import HeroOrbit from './components/HeroOrbit';
import Reveal from './components/Reveal';
import BrandMark from './components/BrandMark';
import { ArticleReader, useOpenReader } from './components/ArticleReader';
import { ListPager, ListToolbar, useListQuery } from './components/ListToolbar';
import {
  Github, Linkedin, Mail, Twitter, Facebook, Instagram, Youtube,
  Gitlab, Code, Terminal, Cpu, Coffee, Globe, Rss, ArrowRight, ArrowUpRight
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

const getSocialIcon = (iconName: string, size = 15) => {
  const LucideIcon = iconMap[iconName.toLowerCase()];
  if (LucideIcon) {
    return <LucideIcon size={size} />;
  }
  // 若配置使用自定义 iconfont 类名，则回退到原生 <i> 以继续展示
  return <i className={iconName} style={{ fontSize: `${size}px` }}></i>;
};

interface SectionHeadProps {
  index: string;
  label: string;
  cn: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// 统一的区块标题：编号 + 英文小标 + 中文注脚 + 衬线大标题
const SectionHead: React.FC<SectionHeadProps> = ({ index, label, cn, title, description, action }) => (
  <div className="mb-8 flex flex-col gap-5 md:mb-11 md:flex-row md:items-end md:justify-between">
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">{index}</span>
        <span className="h-px w-8 bg-[var(--line-strong)]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-faint">{label}</span>
        <span className="font-mono text-[9px] tracking-[0.22em] text-faint/80">/ {cn}</span>
      </div>
      <h2 className="mt-4 font-display text-[2rem] font-semibold leading-tight tracking-wide text-ink md:text-[2.5rem]">
        {title}
      </h2>
      {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-[15px]">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

interface HomePageProps {
  articles: Article[];
  config: AppConfig;
  projects: Project[];
  websites: Website[];
  loading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ articles, config, projects, websites, loading }) => {
  const { hero, projects: projectsSectionCopy, websites: websitesSectionCopy, articles: articlesSectionCopy } = useCopy();
  const lakeDisabled = useLakeDisabled();
  const openReader = useOpenReader();
  const isProjectCountOdd = projects.length % 2 !== 0;
  const profileTagline = config.profile.tagline || `${config.profile.title}. ${config.profile.description}`;
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  useEffect(() => {
    // 星港时间每半分钟校一次即可，没必要每秒重渲染整个首屏
    const timer = window.setInterval(() => {
      setClock(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative pb-24">
      {/* ── 首屏 ────────────────────────────────────────────────────────── */}
      <section className="hero-clip relative pb-16 md:pb-24">
        <div
          className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-70 blur-[90px]"
          style={{ background: 'radial-gradient(circle, var(--glow-lamp) 0%, transparent 66%)' }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[380px] w-[680px] -translate-x-1/2 rounded-full opacity-50 blur-[100px]"
          style={{ background: 'radial-gradient(ellipse, var(--glow-teal) 0%, transparent 70%)' }}
        />

        {/* 右侧竖排招牌，致敬雨夜 diorama 的灯箱 */}
        <div aria-hidden="true" className="pointer-events-none absolute right-[3vw] top-24 hidden flex-col items-center gap-5 xl:flex">
          <span className="h-12 w-px bg-gradient-to-b from-transparent to-[var(--lamp)]/45" />
          <span className="writing-vertical font-display text-[22px] tracking-[0.45em] text-[var(--lamp)]/75 [text-shadow:0_0_26px_rgba(255,196,110,0.32)]">
            極昼星港
          </span>
          <span className="h-16 w-px bg-gradient-to-b from-[var(--lamp)]/45 to-transparent" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--lamp)] shadow-[0_0_16px_5px_rgba(255,196,110,0.3)]" />
        </div>

        <div className="shell relative z-10 flex flex-col items-center text-center">

          <Reveal delay={90}>
            <HeroOrbit avatar={config.profile.avatar} name={config.profile.name} />
          </Reveal>

          <Reveal delay={160} className="mt-6 md:mt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-faint">{hero.greeting}</p>
            <h1 className="hero-name mt-3 font-display text-[clamp(3.4rem,9.5vw,7.5rem)] font-semibold leading-[0.92] tracking-[0.03em]">
              {config.profile.name}
            </h1>
            <div className="mx-auto mt-7 h-px w-28 bg-gradient-to-r from-transparent via-[var(--lamp)]/65 to-transparent" />
          </Reveal>

          <Reveal delay={240} className="mt-6">
            <p className="mx-auto max-w-2xl text-[15px] leading-[2] text-muted md:text-base md:leading-8">
              {profileTagline}
            </p>
          </Reveal>

          <Reveal delay={320} className="mt-9">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {config.profile.social.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--lamp)]/50 hover:text-lamp hover:shadow-[0_16px_40px_-26px_var(--glow-lamp)]"
                  aria-label={item.platform}
                >
                  <span className="text-faint transition-colors duration-300 group-hover:text-lamp">
                    {getSocialIcon(item.icon)}
                  </span>
                  {item.platform}
                </a>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
              <span className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                星港时间 {clock}
              </span>
              <span className="h-3 w-px bg-[var(--line-strong)]" />
              <span>Star Harbor · 星海之间</span>
            </div>
          </Reveal>

          <Reveal delay={420} className="mt-14 hidden md:block">
            <div className="flex flex-col items-center gap-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-faint">Scroll</span>
              <span className="h-12 w-px overflow-hidden bg-[var(--line)]">
                <span className="block h-full w-full origin-top animate-[scroll-line_2.8s_ease-in-out_infinite] bg-gradient-to-b from-[var(--lamp)] to-transparent" />
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 内容 ────────────────────────────────────────────────────────── */}
      <div className="shell space-y-24 md:space-y-32">
        {projects.length > 0 && (
          <section id="projects">
            {isProjectCountOdd ? (
              <>
                <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
                  <div className="lg:col-span-7">
                    <Reveal>
                      <ProjectCard project={projects[0]} />
                    </Reveal>
                  </div>
                  <div className="lg:col-span-5">
                    <Reveal delay={100}>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="eyebrow">01</span>
                        <span className="h-px w-8 bg-[var(--line-strong)]" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-faint">Selected Works</span>
                        <span className="font-mono text-[9px] tracking-[0.22em] text-faint/80">/ 星港档案</span>
                      </div>
                      <h2 className="mt-5 font-display text-[2.2rem] font-semibold leading-tight tracking-wide text-ink md:text-[2.8rem]">
                        {projectsSectionCopy.title}
                      </h2>
                      <p className="mt-5 max-w-md text-[15px] leading-[1.95] text-muted">
                        {projectsSectionCopy.description}
                      </p>
                      <Link to="/projects" className="btn-ghost mt-8">
                        {projectsSectionCopy.viewAll} <ArrowRight size={14} />
                      </Link>

                      {/* 两栏排版里当右栏的收尾装饰；单栏时它会掉到正文下面，
                          变成顶上那个 01 编号的重复，所以只在 lg 以上存在。 */}
                      <div className="mt-12 hidden items-end gap-4 border-t border-[var(--line)] pt-5 lg:flex">
                        <span className="font-display text-6xl leading-none text-[var(--line-strong)]">01</span>
                        <span className="pb-1 font-mono text-[9px] uppercase tracking-[0.28em] text-faint">
                          Exhibit · 精选项目
                        </span>
                      </div>
                    </Reveal>
                  </div>
                </div>

                {projects.length > 1 && (
                  <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                    {projects.slice(1).map((p, idx) => (
                      <Reveal key={p.id} delay={idx * 70} className="h-full">
                        <ProjectCard project={p} />
                      </Reveal>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <SectionHead
                  index="01"
                  label="Selected Works"
                  cn="星港档案"
                  title={projectsSectionCopy.title}
                  description={projectsSectionCopy.description}
                  action={
                    <Link to="/projects" className="btn-ghost">
                      {projectsSectionCopy.viewAll} <ArrowRight size={14} />
                    </Link>
                  }
                />
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {projects.map((p, idx) => (
                    <Reveal key={p.id} delay={idx * 70} className="h-full">
                      <ProjectCard project={p} />
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {websites.length > 0 && (
          <section id="websites">
            <SectionHead
              index="02"
              label="Docked Sites"
              cn="停泊坐标"
              title={websitesSectionCopy.title}
              description={websitesSectionCopy.description}
              action={
                <Link to="/websites" className="btn-ghost">
                  {websitesSectionCopy.viewAll} <ArrowRight size={14} />
                </Link>
              }
            />

            {/* 轮播不套展示框：卡片与湖面直接落在页面背景上 */}
            <Website3DCarousel websites={websites} />
          </section>
        )}

        {/* 湖泊会继续铺到这一区背景上，内容整体抬到 z-10，位置不动但永远在水面之上 */}
        {/* !-mt 把文章区抬进湖水里；湖不渲染的那一档必须收手，否则这 40–64px 会压到卡片上 */}
        <section id="articles" className={`relative z-10 ${lakeDisabled ? '' : '!-mt-10 md:!-mt-16'}`}>
          <SectionHead
            index="03"
            label="Field Notes"
            cn="航行日志"
            title={articlesSectionCopy.title}
            description={articlesSectionCopy.description}
            action={
              <Link to="/articles" className="btn-ghost">
                {articlesSectionCopy.readMore} <ArrowRight size={14} />
              </Link>
            }
          />

          {articles.length > 0 ? (
            <div className="flex flex-col gap-5">
              {articles.map((article, idx) => (
                <Reveal key={article.guid} delay={idx * 60} className="h-full">
                  <ArticleCard article={article} onOpen={a => openReader(a.guid)} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="glass flex flex-col items-center justify-center rounded-[26px] px-6 py-16 text-center">
              <Rss size={22} className="mb-4 text-faint" />
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-faint">No Signal</p>
              <p className="mt-3 font-display text-xl text-ink">
                {loading ? articlesSectionCopy.loading : config.site.rssUrl ? articlesSectionCopy.empty : articlesSectionCopy.noFeed}
              </p>
            </div>
          )}

          <div className="mt-7 flex justify-end">
            <Link to="/articles" className="link-arrow">
              {articlesSectionCopy.readMore} <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

// 分面参数名固定写在模块作用域，避免每次渲染都换一个新数组
const PROJECT_FACETS = ['tag'];
const WEBSITE_FACETS = ['status'];
const ARTICLE_FACETS = ['category'];

// 中文没有词形变化，整串小写包含匹配就够了，不值得为它引一个分词库
const matchesText = (needle: string, ...haystacks: (string | undefined)[]) => {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return haystacks.some(value => value?.toLowerCase().includes(q));
};

// 分面按出现次数从多到少排，次数相同的保持数据里的先后
const tally = (values: string[]) => {
  const counts = new Map<string, number>();
  values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
};

// feed 里的 <category> 只有文本，没有任何标记能区分分类和标签，只能按 Hexo 的固定
// 顺序解释：每条第一项是分类、其余是标签。与 ArticleCard 拿 categories[0] 当主分类同口径。
const articleFacetValues = (items: Article[]) => {
  const categories = tally(items.map(a => (a.categories ?? [])[0]).filter(Boolean) as string[]);
  const known = new Set(categories.map(entry => entry.value));
  const tags = tally(items.flatMap(a => (a.categories ?? []).slice(1))).filter(entry => !known.has(entry.value));
  return [...categories, ...tags];
};

const EmptyResults: React.FC<{ onClear: () => void }> = ({ onClear }) => {
  const { filters: filtersCopy } = useCopy();
  return (
    <div className="glass flex min-h-[240px] flex-col items-center justify-center rounded-[26px] p-10 text-center">
      <p className="font-display text-xl text-ink">{filtersCopy.noResults}</p>
      <button type="button" onClick={onClear} className="btn-ghost mt-6">
        {filtersCopy.clear}
      </button>
    </div>
  );
};

const ProjectsPage: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const { projects: projectsSectionCopy } = useCopy();
  const query = useListQuery(PROJECT_FACETS);
  const tag = query.facetOf('tag');

  const shown = projects.filter(
    p => (!tag || (p.tags ?? []).includes(tag)) && matchesText(query.search, p.title, p.description, ...(p.tags ?? []))
  );

  return (
    <div className="shell py-10 md:py-14">
      <SectionHead
        index="01"
        label="Selected Works"
        cn="星港档案"
        title={projectsSectionCopy.title}
        description={projectsSectionCopy.description}
      />
      <ListToolbar
        facets={[{ param: 'tag', values: tally(projects.flatMap(p => p.tags ?? [])) }]}
        query={query}
        matched={shown.length}
        total={projects.length}
      />
      {shown.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, idx) => (
            <Reveal key={p.id} delay={idx * 60} className="h-full">
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyResults onClear={query.clear} />
      )}
    </div>
  );
};

const WebsitesPage: React.FC<{ websites: Website[] }> = ({ websites }) => {
  const { websites: websitesSectionCopy } = useCopy();
  const query = useListQuery(WEBSITE_FACETS);
  const status = query.facetOf('status');

  const shown = websites.filter(
    w => (!status || w.status === status) && matchesText(query.search, w.title, w.description)
  );

  return (
    <div className="shell py-10 md:py-14">
      <SectionHead
        index="02"
        label="Docked Sites"
        cn="停泊坐标"
        title={websitesSectionCopy.title}
        description={websitesSectionCopy.description}
      />
      <ListToolbar
        facets={[{ param: 'status', values: tally(websites.map(w => w.status)) }]}
        query={query}
        matched={shown.length}
        total={websites.length}
      />
      {shown.length > 0 ? (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((w, idx) => (
            <Reveal key={w.id} delay={idx * 60} className="h-full">
              <WebsiteCard website={w} />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyResults onClear={query.clear} />
      )}
    </div>
  );
};

interface ArticlesPageProps {
  articles: Article[];
  loading: boolean;
  pageSize: number;
}

const ArticlesPage: React.FC<ArticlesPageProps> = ({ articles, loading, pageSize }) => {
  const { articles: articlesSectionCopy } = useCopy();
  const query = useListQuery(ARTICLE_FACETS);
  const openReader = useOpenReader();
  const category = query.facetOf('category');

  const shown = articles.filter(
    a =>
      (!category || (a.categories ?? []).includes(category)) &&
      // 摘要里是原始 HTML，不剥标签会搜到 div 这类标记名
      matchesText(query.search, a.title, a.description.replace(/<[^>]+>/g, ' '), ...(a.categories ?? []))
  );

  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  // 手填或过期的页码可能落在结果集之外，收敛到最后有效页而不是让人看到一片空白
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * pageSize;
  const visible = shown.slice(start, start + pageSize);

  return (
    <div className="shell py-10 md:py-14">
      <SectionHead
        index="03"
        label="Field Notes"
        cn="航行日志"
        title={articlesSectionCopy.title}
        description={articlesSectionCopy.description}
      />

      <ListToolbar
        facets={[{ param: 'category', values: articleFacetValues(articles) }]}
        query={query}
        matched={shown.length}
        total={articles.length}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="glass h-52 animate-pulse rounded-[26px]" />
          ))
        ) : articles.length === 0 ? (
          <div className="glass col-span-1 flex min-h-[240px] flex-col items-center justify-center rounded-[26px] p-10 text-center lg:col-span-2">
            <Rss size={22} className="mb-4 text-faint" />
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-faint">No Signal</p>
            <p className="mt-3 font-display text-xl text-ink">{articlesSectionCopy.empty}</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="lg:col-span-2">
            <EmptyResults onClear={query.clear} />
          </div>
        ) : (
          visible.map(a => <ArticleCard key={a.guid} article={a} onOpen={item => openReader(item.guid)} />)
        )}
      </div>

      {!loading && articles.length > 0 && <ListPager query={query} page={page} pageCount={pageCount} />}
    </div>
  );
};

const StateScreen: React.FC<{ eyebrow: string; title: string; description: string; action: React.ReactNode }> = ({
  eyebrow,
  title,
  description,
  action,
}) => (
  <div className="shell flex min-h-[58vh] flex-col items-center justify-center py-16 text-center">
    <span className="eyebrow">{eyebrow}</span>
    <h1 className="mt-5 font-display text-[2rem] font-semibold leading-tight tracking-wide text-ink md:text-[2.5rem]">
      {title}
    </h1>
    <p className="mt-4 max-w-md text-[15px] leading-[1.95] text-muted">{description}</p>
    {action}
  </div>
);

const NotFoundPage: React.FC = () => {
  const { states } = useCopy();
  return (
    <StateScreen
      action={
        <Link className="btn-ghost mt-8" to="/">
          {states.backHome}
        </Link>
      }
      description={states.notFoundDescription}
      eyebrow="404"
      title={states.notFoundTitle}
    />
  );
};

const ErrorFallback: React.FC = () => {
  const { states } = useCopy();
  return (
    <StateScreen
      action={
        <button className="btn-ghost mt-8" onClick={() => window.location.reload()} type="button">
          {states.reload}
        </button>
      }
      description={states.errorDescription}
      eyebrow="Error"
      title={states.errorTitle}
    />
  );
};

// 路由渲染期抛错时至少留一个能自救的页面，而不是整片白屏
class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <ErrorFallback /> : this.props.children;
  }
}

const LoadingScreen: React.FC<{ label: string; detail: string }> = ({ label, detail }) => (
  <div className="relative flex min-h-screen items-center justify-center px-6">
    <AmbientBackground />
    <div className="glass-strong relative w-full max-w-md rounded-[30px] px-10 py-12 text-center">
      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center">
        <span className="absolute h-12 w-12 rounded-full border border-[var(--line-strong)]" />
        <span className="absolute h-8 w-8 rounded-full border border-dashed border-[var(--lamp)]/50 animate-spin [animation-duration:8s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--lamp)] shadow-[0_0_14px_4px_var(--glow-lamp)]" />
      </div>
      <p className="eyebrow">Polaris Harbor</p>
      <p className="mt-4 font-display text-2xl tracking-wide text-ink">{label}</p>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.24em] text-faint">{detail}</p>
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
  const initialized = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes this effect in dev; without the guard every source
    // (config.yml, both data files, the RSS feed) is requested twice per load.
    if (initialized.current) return;
    initialized.current = true;

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
    // BrowserRouter 下每个路由都要有自己的 canonical，否则会互相声明重复内容
    if (config) applyCanonicalUrl(config);
    // 只跟随路径：筛选和翻页写的是查询串，逐键回到顶部会把人从列表里甩出去
  }, [location.pathname, config]);

  if (configError) {
    return <LoadingScreen label="星港坐标校准失败" detail={`Configuration error · ${configError}`} />;
  }

  if (!config) {
    return <LoadingScreen label="正在校准星港坐标" detail="Loading configuration" />;
  }

  const copy = resolveCopy(config.copy);

  // 首页仅截取配置数量，避免一次性渲染过多卡片
  const display = config.display;
  const homeProjects = projects.slice(0, display?.projectCount ?? 3);
  const homeWebsites = websites.slice(0, display?.websiteCount ?? 6);
  const homeArticles = articles.slice(0, display?.articleCount ?? 3);

  return (
    <CopyProvider value={copy}>
      <div className="relative flex min-h-screen flex-col font-sans text-ink">
        <AmbientBackground meteors={config.effects?.meteors} />
        <Navbar siteConfig={config.site} />

        <main className="relative flex-grow pt-24 md:pt-28">
          <RouteErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    articles={homeArticles}
                    config={config}
                    projects={homeProjects}
                    websites={homeWebsites}
                    loading={loadingArticles}
                  />
                }
              />
              <Route path="/projects" element={<ProjectsPage projects={projects} />} />
              <Route path="/websites" element={<WebsitesPage websites={websites} />} />
              <Route
                path="/articles"
                element={
                  <ArticlesPage
                    articles={articles}
                    loading={loadingArticles}
                    pageSize={Math.max(1, display?.articlePageSize ?? 6)}
                  />
                }
              />
              {/* 没有这一条，敲错的地址会渲染出导航栏和页脚中间的一片空白 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </RouteErrorBoundary>
        </main>

        <footer className="relative mt-16 border-t border-[var(--line)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--lamp)]/35 to-transparent" />
          <div className="shell py-12">
            <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
              <div className="max-w-sm">
                <Link to="/" className="group inline-flex items-center gap-3">
                  <BrandMark site={config.site} size="sm" />
                  <span className="font-display text-xl font-semibold tracking-wide text-ink transition-colors duration-300 group-hover:text-lamp">
                    {config.site.brandName}
                  </span>
                </Link>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {config.profile.title} · {config.profile.description}
                </p>
                <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.3em] text-faint">
                  Polaris Harbor · 星海之间
                </p>
              </div>

              <div className="flex flex-col gap-4 md:items-end">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-faint">Coordinates</p>
                <nav className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
                  {(config.footer.links ?? []).map((link, idx) =>
                    link.url ? (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors duration-300 hover:text-lamp"
                      >
                        {link.text}
                      </a>
                    ) : (
                      <span key={idx} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                        {link.text}
                      </span>
                    )
                  )}
                </nav>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-[var(--line)] pt-6 text-[11px] text-faint md:flex-row md:items-center md:justify-between">
              <p>
                &copy; {new Date().getFullYear()} {config.footer.owner}. {copy.footer.rights}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {config.footer.icp && (
                  <a
                    href="https://beian.miit.gov.cn/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors duration-300 hover:text-lamp"
                  >
                    {config.footer.icp}
                  </a>
                )}
                <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-faint">
                  Built in the star harbor
                </span>
              </div>
            </div>
          </div>
        </footer>

        {/* 阅读层挂在路由之外：首页只显示前几条文章，正文要用完整的 feed 列表去匹配 */}
        <ArticleReader articles={articles} />
      </div>
    </CopyProvider>
  );
};

export default App;
