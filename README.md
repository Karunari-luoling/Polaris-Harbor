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
- `profile`：昵称、头像、称号、一句话简介、详细介绍、社交链接。`social[].icon` 填 Lucide 图标名（如 `github`、`mail`、`rss`）时直接用内置图标，填自定义 iconfont 类名时会回退成 `<i>`。
- `site`：`logoImage` 导航栏 logo、`brandName` 品牌名、`favicon`、`rssUrl` 文章源。`extraPreconnect` 只在图床经过 302 跳转到另一个域名时才需要填，其余情况留空即可。
- `dataSources`：`type` 取 `local`（`public/` 下的相对路径）或 `remote`（完整 URL），`format` 取 `yml` 或 `json`，两种格式都支持，可以一个数据源用 yml、另一个用 json。用 `remote` 时对方必须返回 `Access-Control-Allow-Origin`，GitHub raw 和 jsDelivr 默认就带。
- `display`：首页各区块显示条数。
- `copy`：界面文案。三个区块的标题与介绍、导航项名称、问候语（`Hello, I'm`）、`View all projects` / `Visit Site` / `View Project` / `Read` 这类按钮与链接文字、文章区的加载与空状态提示、`Uncategorized` 兜底分类名，以及日期语言 `articles.dateLocale`（默认 `en-US`，想要「2026年1月17日」这种填 `zh-CN`）。**这里没写的项会自动回退到组件内置的默认值**，所以只改你想改的几条就行，不必全填。
- `footer`：版权主体、备案号、底部链接。`icp` 留空则不显示备案行。

内容数据的字段结构就是 `types.ts` 里的 `Project` 与 `Website` 两个接口。`data/` 下同名 yml 与 json 是两套并行副本，`config.yml` 的 `format` 决定读哪个，改完一份记得同步另一份。

`index.html` 里的 preconnect 提示、开发服务器的 RSS 代理目标，都由构建期读取 `config.yml` 自动推导，换图床或换博客域名不需要改这两个文件。

想在本地开发时看到文章列表，把 `site.rssUrl` 临时改成相对路径 `/feed.xml` 即可走 Vite 代理绕开跨域；这个改动只影响本地，上线前记得改回真实地址。

# 图标使用
项目自适应图标，可以选择Lucide图标库、FontAwesome图标库。
图标使用 [Lucide](https://lucide.dev/) 图标库。
图标使用 [FontAwesome](https://fontawesome.com/) 图标库。
也可以在site中配置Alibaba Iconfont图标库。

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
```

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
