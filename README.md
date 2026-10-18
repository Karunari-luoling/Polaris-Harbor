1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

# 改成你自己的
换身份只需要动两个地方，不需要在源码里搜索替换任何域名或账号。

1. `public/config.yml`：站点全部身份与开关。
2. `public/data/`：项目、网站两类内容数据。

`config.yml` 各段含义：

- `seo`：搜索引擎与社交分享用的标题、描述、关键词、作者、分享图。`canonicalUrl` 填你的站点根地址（不带结尾斜杠），它同时决定 `robots.txt`、`sitemap.xml` 里的地址和页面里的 canonical，留空则不生成 `sitemap.xml`。
- `theme`：`mode` 取 `auto`（跟随系统）、`manual`（固定 `default`）、`custom`（按 `customSchedule` 的时间段切暗色）。
- `effects.meteors`：夜间流星。`enabled` 控制开关，`frequency` 是平均每分钟的流星数量（0 即关闭，建议 3–15）。流星只在暗色主题下绘制，且会遵守系统的“减少动态效果”设置。
- `profile`：昵称、头像、称号、一句话简介、详细介绍、社交链接。`social[].icon` 填 Lucide 图标名（如 `github`、`mail`、`rss`）时直接用内置图标，填自定义 iconfont 类名时会回退成 `<i>`。
- `site`：`logoImage` 导航栏 logo、`brandName` 品牌名、`favicon`、`rssUrl` 文章源。`extraPreconnect` 只在图床经过 302 跳转到另一个域名时才需要填，其余情况留空即可。
- `dataSources`：`type` 取 `local`（`public/` 下的相对路径）或 `remote`（完整 URL），`format` 取 `yml` 或 `json`，两种格式都支持，可以一个数据源用 yml、另一个用 json。用 `remote` 时对方必须返回 `Access-Control-Allow-Origin`，GitHub raw 和 jsDelivr 默认就带。
- `display`：`projectCount` / `websiteCount` / `articleCount` 是首页各区块的显示条数；`articlePageSize` 是文章列表页每页几条，筛选与分页都在这个容量之上进行。
- `copy`：界面文案。三个区块的标题与介绍、导航项名称、问候语（`Hello, I'm`）、`View all projects` / `Visit Site` / `View Project` / `Read` 这类按钮与链接文字、文章区的加载与空状态提示、`Uncategorized` 兜底分类名，以及日期语言 `articles.dateLocale`（默认 `en-US`，想要「2026年1月17日」这种填 `zh-CN`）。**这里没写的项会自动回退到组件内置的默认值**，所以只改你想改的几条就行，不必全填。
- `copy.filters`：三个列表页共用的筛选界面文字。`search` 是搜索框提示，`all` 是分面里的「全部」项，`clear` 清空筛选，`noResults` 无结果时的说明，`showing` 是计数（`{n}` 命中数、`{total}` 总数），`prev` / `next` 翻页按钮，`pageLabel` 页码（`{page}` 当前页、`{pages}` 总页数），`more` / `less` 是标签折叠开关（`{n}` 被折叠的条数）。花括号按名字替换，模板里写了未知的花括号会原样留着，好让人一眼看出是配置写错。
- `copy.reader`：站内阅读的界面文字。`loading` 是正文取回前的提示，`original` 是「阅读原文」，`close` 是关闭按钮，`notFound` 是地址里的文章已经不在 feed 里时显示的那句。
- `copy.states`：兜底页的文字。`notFoundTitle` / `notFoundDescription` / `backHome` 是 404 页，`errorTitle` / `errorDescription` / `reload` 是页面抛错时的兜底。
- `footer`：版权主体、备案号、底部链接。`icp` 留空则不显示备案行。

内容数据的字段结构就是 `types.ts` 里的 `Project` 与 `Website` 两个接口。`data/` 下同名 yml 与 json 是两套并行副本，`config.yml` 的 `format` 决定读哪个，改完一份记得同步另一份。

`index.html` 里的 preconnect 提示、开发服务器的 RSS 代理目标，都由构建期读取 `config.yml` 自动推导，换图床或换博客域名不需要改这两个文件。

想在本地开发时看到文章列表：Vite 的代理路径是从 `site.rssUrl` 的 pathname 推出来的（本项目是 `/atom.xml`），并且在服务器启动那一刻就定下。所以把 `rssUrl` 改成**同一条路径**的相对值 `/atom.xml`，请求变成同源，正好命中那个已经在跑的代理，跨域就绕开了；改成别的路径（比如 `/feed.xml`）代理并不存在，只会拿到 404。这个改动只影响本地，上线前记得改回真实地址。

# 图标使用
项目自适应图标，可以选择Lucide图标库、FontAwesome图标库。
图标使用 [Lucide](https://lucide.dev/) 图标库。
图标使用 [FontAwesome](https://fontawesome.com/) 图标库。
也可以在site中配置Alibaba Iconfont图标库。

# 列表页筛选
`/projects`、`/websites`、`/articles` 三个列表页可以按标签、状态、分类筛选，也能搜标题与摘要，文章列表另有分页。筛选状态全部写在地址栏的查询串里（`?tag=`、`?status=`、`?category=`、`?q=`、`?page=`），所以任何一个筛选结果都能直接复制链接分享，刷新或冷加载都会回到同一个画面。首页不做筛选，它只按 `display` 截取条数。

候选标签由数据自身统计得出，超过 8 个自动折进「更多」。只有唯一一个候选值的分面整组不显示。地址里选中的标签即使排在折叠区之外也会被单独列出，免得分享出去的链接看不出选的是哪一个。

排序上，项目标签与网站状态按出现次数从多到少排。文章页那一行是**先列完分类、再列标签**，两组内部各自按频次排：feed 里的 `<category>` 只有文本、没有任何能区分类型的标记，只能按 Hexo 的固定输出顺序解释——每条 item 的第一项是分类，其余是标签，这与文章卡片把 `categories[0]` 当主分类显示是同一个口径。代价是一个分类若在别的文章里以标签身份出现，会被归到分类那一组（去重保留前者）；若某篇文章在 Hexo 里挂了两个分类，第二个会被当成标签显示。

翻页与筛选之间是有讲究的：改了标签或搜索，`page` 会当场作废并回到第一页，否则会停在一个已经不存在的页码上；反过来地址里手填的页码超出结果集时不会给你一片空白，而是收敛到最后有效页。因为筛选只动查询串、不动路径，页面不会回到顶部，人不会被从列表里甩出去。

改数据不需要改代码：往 `public/data/projects.yml` 的 `tags` 里加一个新标签，`/projects` 上就自动多出这个筛选项。

# 站内阅读
点文章卡片会在站内展开一层全文阅读，正文来自 feed。只有经过 DOMPurify 消毒的输出才允许进页面：脚本、iframe、表单、内联事件属性和 `javascript:` 链接都会被剥掉，正文里的外链会被强制成 `target="_blank"` 加 `rel="noopener noreferrer"`。阅读状态记在地址栏的 `?read=<文章标识>` 上，可以直接复制链接分享；Esc 或点遮罩关闭，关闭时地址收回干净。消毒器只在第一次打开阅读时才拉，不占首屏那部分体积。

**前提是你的 feed 真的带全文。** 消毒只解决安全，不解决内容：解析时依次取 `content:encoded` → `content` → `description` → `summary`，取到哪个用哪个。Hexo 默认的 `hexo-generator-feed` 在 RSS 2.0 下只输出摘要，这时阅读层展开的还是一段摘要加一个「阅读原文」，从界面上看不出是 feed 缺了内容。先确认一下：

```bash
curl -s https://你的博客/atom.xml | grep -c content:encoded
```

返回 0 就是没带全文，需要在博客侧的 feed 生成配置里放开，主页这边改不了。

# 兜底页
地址里的路径不存在时显示 404 页，而不是导航栏和页脚中间的一片空白；某个页面在渲染期抛错时由错误边界接住，给出重新加载的入口，导航和页脚照常可用。两种页面的文字都在 `copy.states` 里。

# 部署
1. 构建：
   `npm run build`
2. 上传：
   把 `dist/` 目录整个作为站点根目录，无需服务端运行时。
3. 必须配置路径回退：
   站点使用 BrowserRouter，`/projects`、`/websites`、`/articles` 是真实路径，服务器上并不存在这些文件，刷新会 404。必须把未命中的请求回退到 `index.html`：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

# 静态资源缺失要继续返回真 404。少了这一段，回退会把 index.html 以 200 发给一个
# 不存在的 .js 请求，浏览器按脚本解析直接语法报错，比 404 难查得多
location ~* \.(?:js|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|map)$ {
    try_files $uri =404;
}
```

宝塔上这段放进站点的伪静态规则即可（`/www/server/panel/vhost/rewrite/域名.conf`，宝塔会自动 include 进 server 块）。若 `nginx -t` 报 `duplicate location "/"`，说明主配置里已有 `location /`，把 `try_files` 并进那个已有块而不是再写一条。站点前面还有 CDN 时，改完源站要去 CDN 提交 URL 刷新——404 也会被缓存，否则外面看到的还是旧结果。

Nginx、宝塔、以及各类静态托管（OSS 静态网站索引、Vercel、Netlify、Cloudflare Pages）都提供等价的重写规则，配完再上线，否则子页面刷新即 404。旧的 `#/projects` 链接会在前端自动改写到对应真实路径，不会变死链。

# SEO 产物
构建时会依据 `seo.canonicalUrl` 在 `dist/` 根生成 `robots.txt` 与 `sitemap.xml`，并把 canonical、og:url、twitter:card 直接写进 `index.html`，不依赖爬虫执行 JS。改完 `canonicalUrl` 需重新构建。若该项为空，`sitemap.xml` 不会生成，构建会给出提示。

# 文章源（RSS 跨域）
`site.rssUrl` 指向另一个域名时属于跨源请求，浏览器会因缺少 CORS 头而拦截，页面表现为"没有文章"。需要博客侧对 feed 放行来源。以 nginx 为例，在 `blog.example.com` 的 server 块中加入：

```nginx
location = /feed.xml {
    # 保持原有的 alias / proxy_pass / try_files 配置不变，只追加以下响应头
    add_header Access-Control-Allow-Origin "https://www.example.com" always;
    add_header Access-Control-Allow-Methods "GET, HEAD" always;
    add_header Access-Control-Allow-Headers "Accept" always;
}
```

改完 `nginx -t && nginx -s reload` 生效。若博客前置了 CDN（腾讯云 EdgeOne、Cloudflare、阿里云 CDN 等），通常在 CDN 的响应头规则里加同一条更省事，不必改源站。

另一种做法是不依赖博客：在主页所在域名上把 `/feed.xml` 反向代理到博客，然后把 `config.yml` 的 `rssUrl` 改成相对路径 `/feed.xml`。这样请求变成同源，跨域问题从根上消失。
