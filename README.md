1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

# 图标使用
项目自适应图标，可以选择Lucide图标库、FontAwesome图标库。
图标使用 [Lucide](https://lucide.dev/) 图标库。
图标使用 [FontAwesome](https://fontawesome.com/) 图标库。
也可以在site中配置Alibaba Iconfont图标库。

# 部署
1. 构建：
   `npm run build`
2. 上传：
   把 `dist/` 目录整个作为站点根目录，无需服务端。`HashRouter` 已让子路由走 `#/projects` 形式，因此不需要额外的 SPA fallback 重写规则。

# 配置说明
`config.yml` 与 `data/` 位于 `public/` 下，构建时原样拷贝到 `dist/` 根目录，运行时由页面直接读取。改这些文件不需要动代码。

注意：`theme` 段同时被构建期注入到首页的内联脚本里，用于避免首屏主题闪烁。修改 `theme` 后需重新执行 `npm run build` 才能让首次访问就按新排程上色，否则首屏仍按上一次构建的快照渲染。

# 文章源（RSS 跨域）
`site.rssUrl` 指向博客域名时属于跨源请求，浏览器会因缺少 CORS 头而拦截，页面表现为"没有文章"。需要博客侧对 `feed.xml` 放行来源。以 openresty/nginx 为例，在 `blog.byer.ink` 的 server 块中加入：

```nginx
location = /feed.xml {
    # 保持原有的 alias / proxy_pass / try_files 配置不变，只追加以下响应头
    add_header Access-Control-Allow-Origin "https://www.byer.ink" always;
    add_header Access-Control-Allow-Methods "GET, HEAD" always;
    add_header Access-Control-Allow-Headers "Accept" always;
}
```

改完 `nginx -t && nginx -s reload` 生效。若主页与博客同属一个域名，把 `rssUrl` 写成相对路径即可，无需任何额外配置。

实测 `blog.byer.ink` 前置了腾讯云 EdgeOne（响应头含 `Server: openresty`、`EO-Cache-Status: HIT`），因此也可以不改源站 Nginx，直接在 EdgeOne 的响应头规则里对 `/feed.xml` 追加同一个 `Access-Control-Allow-Origin`。

另一种做法是不依赖博客：在主页所在的 `www.byer.ink` 上把 `/feed.xml` 反向代理到博客，然后把 `config.yml` 的 `rssUrl` 改成相对路径 `/feed.xml`。这样请求变成同源，跨域问题从根上消失。

本地开发可用相对路径 `/feed.xml` 走 Vite 的 `server.proxy` 绕开跨域，该代理只在 dev 生效，不影响构建产物。
