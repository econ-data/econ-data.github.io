# Econ Datalab

主页：https://econ-data.github.io/

## 维护

纯静态网站，无构建依赖。编辑 `data.json` 更新内容。GitHub Pages 从 main 分支根目录自动发布。

- `regions`: 中国数据、美国数据、全球数据、欧洲数据、拉美数据、亚洲数据、其它数据，可为多个地区。
- `topics`: 普查数据、微观调查数据、微观企业数据、区域经济数据、地理数据、环境数据、健康数据、交通数据、政治数据、房地产数据、金融数据、商业数据、农业数据、贸易数据，可为多个话题。
- `introduction`: 数据介绍。
- `source`: 数据来源说明。
- `references`: 数据应用文献，包括 authors、year、title、journal、volume、issue、pages、doi、url、verified；论文标题使用 url 跳转。未经核实的简写引用标注待核对，不提供猜测链接。
- `links`: 数据链接。当前全部为空数组；随时可添加，例如 `[{"label":"数据提供方","url":"https://example.org/data"}]`，网页会自动显示。
- `summary`: 列表摘要。

原始 PDF 不公开、不包含于仓库。数据下载链接已经清空；论文链接仅保留在应用文献中。七个地区及十四个话题固定展示，暂无条目时显示空分类。

## 本地预览

`python -m http.server 8080` 后打开 http://localhost:8080 。
