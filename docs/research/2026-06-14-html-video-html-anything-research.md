# `html-video` / `html-anything` 调研报告

日期：2026-06-14

## 调研目标

本次调研关注两个开源仓库：

- [`nexu-io/html-video`](https://github.com/nexu-io/html-video)
- [`nexu-io/html-anything`](https://github.com/nexu-io/html-anything)

目标不是复述 README，而是回答下面两个问题：

1. 这两个仓库各自解决什么问题，核心能力是什么。
2. 结合当前仓库，哪些能力值得复用，哪些不值得引入。

当前仓库的实际定位是：

- 用固定模板生成“人物立绘 + 六维雷达图”的视频
- 当前默认流程是 `JSON 数据 -> 本地预览 -> HyperFrames 渲染 MP4`
- 当前核心入口和数据在：
  - [README.md](/E:/ai-list/ai-video/README.md)
  - [data/videos/active-video.json](/E:/ai-list/ai-video/data/videos/active-video.json)
  - [data/videos/delta-firestorm-sample.json](/E:/ai-list/ai-video/data/videos/delta-firestorm-sample.json)
  - [data/assets/operator-image-map.json](/E:/ai-list/ai-video/data/assets/operator-image-map.json)

## 一、`html-video` 是什么

### 1.1 项目定位

`html-video` 的目标不是“做一个固定视频模板”，而是做一个更高层的视频生成平台：

- 输入可以是自然语言、文章链接、GitHub 仓库链接
- 中间通过 agent 生成 storyboard / content graph / 多帧 HTML
- 最终渲染为真实 MP4

它强调的是：

- 本地运行
- agent 驱动
- 多模板
- 多引擎抽象

按官方 README 的说法，它是一个位于具体视频引擎之上的 meta-layer。当前真正可运行的渲染后端是 Hyperframes，Remotion / Motion Canvas / Manim 仍然在 roadmap 中。

### 1.2 关键能力

从官方 README 看，`html-video` 目前最关键的能力有：

- 基于 prompt / article / repo 生成视频
- 21 个模板的 gallery
- agent 自动检测与切换
- content-graph 驱动多场景视频
- 本地 MP4 渲染
- 可选 AI 音乐和旁白
- Studio + CLI 双入口

### 1.3 对当前仓库的启发

对当前仓库最有价值的，不是“整套照搬”，而是下面 4 个思路：

1. 模板层和渲染层分离
2. 多场景视频用统一 storyboard / IR 管理
3. 模板清单化，而不是把模板逻辑散在代码里
4. 将“内容生成”和“视频渲染”拆成两个阶段

## 二、`html-anything` 是什么

### 2.1 项目定位

`html-anything` 的核心不是“视频工具”，而是一个 agentic HTML editor。

它做的是：

- 把各种输入交给本地 agent
- 生成最终给人看的 HTML
- 再把 HTML 导出到不同表面

它覆盖的表面很多：

- 文章
- deck
- 海报
- 卡片
- 报告
- Web prototype
- Hyperframes video frame

本质上它更像“基于技能和模板的 HTML 生成工作台”。

### 2.2 关键能力

从官方 README 看，`html-anything` 的关键能力有：

- 8 个本地 coding-agent CLI 自动检测
- 75 个 skill 模板
- 9 类 surface mode
- iframe 实时预览
- SSE 流式生成
- 一键导出 HTML / PNG / WeChat / X / Zhihu
- Hyperframes 视频帧模板

### 2.3 对当前仓库的启发

对当前仓库最有价值的，不是它的导出平台能力，而是：

1. skill / template catalog 的组织方式
2. 按 surface / scenario 分类模板的思路
3. “同一份内容可进入不同输出形态”的仓库结构
4. 将 Hyperframes frame 当作一类模板资源管理

## 三、和当前仓库的本质差异

### 3.1 当前仓库更专用

当前仓库是高度垂直的：

- 固定一种视频结构
- 固定一种视觉布局
- 固定六维雷达图
- 固定 JSON 数据驱动

这带来的好处是：

- 结构清晰
- 成本低
- 迭代快
- 出片稳定

但代价也很明确：

- 模板扩展能力弱
- 场景复用主要靠复制 JSON，而不是切换模板
- 内容来源还需要人工整理

### 3.2 `html-video` / `html-anything` 更平台化

这两个仓库都不是“只为某一种视频服务”。

它们更像：

- 模板平台
- agent 工作台
- 多输出面板
- 可扩展能力层

所以两边并不在一个抽象层级上。

当前仓库更接近：

- 一个稳定可控的垂类视频生产线

而不是：

- 一个通用的 agent 媒体创作平台

## 四、哪些能力当前仓库可以直接使用

下面按优先级拆分。

### 4.1 建议直接引入的能力

#### A. 模板清单 / manifest 机制

来源：

- `html-video` 的 template gallery 和 manifest 思路
- `html-anything` 的 skill 目录和分类方式

为什么适合当前仓库：

- 你已经明确提出“内容填充”和“视频架构”要拆成两个固定流程
- 当前仓库虽然实现了“单一入口配置”，但视频模板仍然只有一套主模板
- 一旦你后面做《无畏契约》、别的榜单、别的题材，模板数一多，就会开始失控

建议落地方式：

- 增加 `data/templates/` 或 `templates/` 目录
- 每个模板包含：
  - 名称
  - 适用题材
  - 画幅
  - 支持的字段
  - 对应 HTML 模板路径
  - 对应动画预设

当前收益：

- 你能把“干员雷达面板”“武器评分面板”“职业对比面板”做成三套模板，而不是复制脚本

#### B. 模板与数据完全解耦

当前仓库已经走在这条路上，但还不彻底。

目前已有：

- [data/videos/active-video.json](/E:/ai-list/ai-video/data/videos/active-video.json)
- [data/videos/delta-firestorm-sample.json](/E:/ai-list/ai-video/data/videos/delta-firestorm-sample.json)

可以继续向 `html-video` 的方向推进：

- 数据只描述内容
- 模板只描述视觉和布局
- 渲染层只负责拼装

这样后面切模板，不必复制一份完整业务 JSON。

#### C. 场景元数据化

`html-video` 用 content graph / frame 组织多场景视频。

当前仓库虽然还不需要完整 content graph，但可以先补更轻量的 scene metadata：

- 每个条目允许单独覆盖停留时长
- 每个条目允许单独切换人物动画
- 每个条目允许单独切换雷达动画
- 每个条目允许配置标题副标题

这会让当前仓库从“统一轮播模板”升级到“半结构化视频模板”。

### 4.2 可以选做的能力

#### D. 音轨层

`html-video` 的 AI 音乐和旁白功能对当前仓库不是刚需，但有扩展价值。

当前适合的最小版本不是接 AI 音乐平台，而是：

- 允许配置一个背景音乐文件
- 渲染时自动混入 MP4

如果后面你要批量做短视频，这个能力很值。

#### E. 多来源内容采集

`html-video` 支持 article / repo -> video。

当前仓库如果要做“榜单视频”或“解说视频”，这条能力会有价值，但不是现在这一版的主线。

适合引入的前提是：

- 你希望把“资料整理”也纳入流水线

当前不适合直接做的原因：

- 你现在做的是结构化雷达视频
- 数据核心仍然是你自己判断出来的六维分数
- 自动抓取不会自动生成可信评分

换句话说：

- 采集可以自动化
- 评分不能直接自动化

#### F. HTML / PNG 多输出

`html-anything` 很强调一份内容导出到多平台。

对当前仓库，适合的不是直接做 WeChat / X / Zhihu，而是考虑这两个衍生输出：

- 单角色评分海报 PNG
- 横版封面图 PNG

这会直接服务短视频封面和图文分发。

### 4.3 当前不建议引入的能力

#### G. 全量 agent studio

`html-video` 和 `html-anything` 都有比较重的 studio / agent orchestration 层。

当前仓库不建议引入，原因很直接：

- 现在的核心问题不是 agent 调度
- 现在的核心问题是模板能力和数据组织能力
- 一旦先上 studio，会明显增加维护面

对当前项目来说，这会是典型的过度设计。

#### H. 多 agent CLI 自动检测

`html-anything` 和 `html-video` 都强调多 agent 自动检测。

当前仓库没有必要：

- 你不是在做一个面向外部用户的 agent 平台
- 当前仓库是一个本地创作流水线
- 引入多 agent 层不会提升出片质量，反而提升复杂度

#### I. 完整 content graph 引擎

`html-video` 的 content graph 很适合“文章解读视频”“repo 讲解视频”“知识卡点视频”。

但对当前“人物面板轮播视频”来说，属于明显过重。

当前更合理的是：

- 先做轻量 scene schema
- 真要做 narrative / explainer 视频时，再考虑 graph

## 五、建议的引入顺序

如果后续要在当前仓库上继续演进，我建议按这个顺序：

### 第一阶段：低成本高收益

1. 模板 manifest 化
2. 数据和模板进一步解耦
3. 条目级 scene metadata
4. 单角色封面图 / 海报导出

### 第二阶段：可选增强

1. 音乐 / 旁白轨道
2. 多输出格式
3. 简单的素材采集辅助

### 第三阶段：只有在仓库要平台化时再考虑

1. 多 agent CLI 接入
2. studio 化模板选择器
3. content graph / storyboard 引擎

## 六、结合当前仓库的具体结论

### 结论 1

当前仓库已经具备一个可用的视频生产线，但还不是模板系统。

### 结论 2

`html-video` 对当前仓库最值得借鉴的是“模板平台化”和“多场景 IR”思路，不是整套 agent 工作台。

### 结论 3

`html-anything` 对当前仓库最值得借鉴的是“skill / template catalog”和“多输出面管理”，不是它的 HTML editor 主体。

### 结论 4

如果只问“当前仓库现在能直接使用什么能力”，优先级最高的是：

1. 模板 manifest
2. 多模板切换
3. 条目级 scene metadata
4. PNG 封面/海报导出

## 七、推荐下一步

如果基于这份调研继续落地，最合理的下一步不是直接引第三方仓库代码，而是在当前仓库内部先做下面这件事：

- 把当前单一雷达模板，升级为“模板注册表 + 模板配置文件”

这样你后面做：

- 干员强度
- 武器评分
- 角色对比
- 赛季榜单

都可以共用一条流水线。

## 参考资料

- `html-video` 官方仓库：
  - [https://github.com/nexu-io/html-video](https://github.com/nexu-io/html-video)
  - [https://raw.githubusercontent.com/nexu-io/html-video/main/README.md](https://raw.githubusercontent.com/nexu-io/html-video/main/README.md)
- `html-anything` 官方仓库：
  - [https://github.com/nexu-io/html-anything](https://github.com/nexu-io/html-anything)
  - [https://raw.githubusercontent.com/nexu-io/html-anything/main/README.md](https://raw.githubusercontent.com/nexu-io/html-anything/main/README.md)
- 当前仓库相关文件：
  - [README.md](/E:/ai-list/ai-video/README.md)
  - [data/videos/active-video.json](/E:/ai-list/ai-video/data/videos/active-video.json)
  - [data/videos/delta-firestorm-sample.json](/E:/ai-list/ai-video/data/videos/delta-firestorm-sample.json)
  - [data/assets/operator-image-map.json](/E:/ai-list/ai-video/data/assets/operator-image-map.json)
