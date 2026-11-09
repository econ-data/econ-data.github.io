# Econ Datalab

主页：https://econ-data.github.io/

## 维护

纯静态网站，无构建依赖。编辑 `data.json` 更新内容。GitHub Pages 从 main 分支根目录自动发布。

- `id`: 编号 `地区.类型.序号`。地区：1 中国数据、2 美国数据、3 欧洲数据、4 亚洲数据、5 拉美数据、6 其他国家数据、7 全球数据；类型：1 普查数据、2 微观调查数据、3 微观企业数据、4 区域经济数据、5 地理数据、6 环境数据、7 能源数据、8 健康数据、9 交通数据、10 政治数据、11 房地产数据、12 金融数据、13 商业数据、14 农业数据、15 贸易数据。条目有多个地区或类型时取最小编号，`data.json` 按编号排序。
- `regions` / `topics`: 地区与类型标签，可为多个，编号取其中最小者。
- `introduction`: 数据介绍。
- `source`: 数据来源说明。
- `references`: 数据应用文献，包括 authors、year、title、journal、volume、issue、pages、doi、url、verified；论文标题使用 url 跳转。未经核实的简写引用标注待核对，不提供猜测链接。
- `links`: 数据链接，仅收录经核实的官方数据页、下载页或申请页，例如 `[{"label":"数据提供方","url":"https://example.org/data"}]`，网页会自动显示。
- `summary`: 列表摘要。

原始 PDF 不公开、不包含于仓库。数据链接仅收录经核实的官方页面。七个地区及十五个话题固定展示，暂无条目时显示空分类。

## 本地预览

`python -m http.server 8080` 后打开 http://localhost:8080 。

## 文献目录（papers.html）

与数据目录平行的文献界面，按“领域—主题—问题”排版。数据由 `work/papers/parse_papers.py`（解析 Reading Notes PDF 的书签目录与标题/作者链接）和 `work/papers/build_papers.py` 生成：

- `papers/index.json`: 领域—主题—问题树及文献数量。编号 = 领域.主题.问题，文献 id = 领域.主题.问题.序号（问题号 0 表示直接挂在主题下的综合文献）。
- `papers/f<N>.json`: 第 N 个领域的文献，字段 id/q/key/venue/year/title/url/authors[name,aff,url]/abstract。
- `papers/summaries.json`: 论文总结，按 `key`（标题+年份）存放 `{question, method, data, conclusion}`（研究问题、研究方法、研究数据、研究结论）。只收录已写总结的文献；未收录的在网页上显示“待补充”。同一论文出现在多个问题下时共享同一份总结，重新生成文献时总结不会丢失。
