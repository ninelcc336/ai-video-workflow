# 雷达面板视频仓库使用说明

这个仓库用于生成“人物立绘 + 六维雷达图”的横版视频。当前默认题材是《三角洲行动》烽火地带干员强度面板，但整套流程是可复用的，后续换成别的游戏或别的话题，主要改数据文件即可。

当前产物有两类：

- 浏览器预览页：用于快速看单页切换、人物图、雷达图和动画效果
- HyperFrames 成片：用于导出最终 MP4

## 仓库结构

最常用的目录和文件如下：

- [data/videos/active-video.json](/E:/ai-list/ai-video/data/videos/active-video.json)
  当前启用的视频配置入口。以后切换到别的 JSON，只改这里。
- [data/templates/registry.json](/E:/ai-list/ai-video/data/templates/registry.json)
  模板注册表索引。这里登记仓库内有哪些可用模板。
- [data/templates/operator-radar-landscape-v1.json](/E:/ai-list/ai-video/data/templates/operator-radar-landscape-v1.json)
  当前默认模板的 manifest。包含模板 id、适用 family、尺寸和雷达参数。
- [data/videos/delta-firestorm-sample.json](/E:/ai-list/ai-video/data/videos/delta-firestorm-sample.json)
  当前默认视频的数据文件。标题、模板、节奏、动画、干员列表、六维分数都在这里。
- [data/assets/operator-image-map.json](/E:/ai-list/ai-video/data/assets/operator-image-map.json)
  干员名称/外号/别名到图片路径的映射表。
- [assets/operators](/E:/ai-list/ai-video/assets/operators)
  干员图片素材目录。
- [app](/E:/ai-list/ai-video/app)
  本地预览页代码。
- [video-src/index.template.html](/E:/ai-list/ai-video/video-src/index.template.html)
  HyperFrames 视频模板。
- [scripts](/E:/ai-list/ai-video/scripts)
  构建、校验、预览服务、HyperFrames 调用脚本。
- [renders/radar-panel.mp4](/E:/ai-list/ai-video/renders/radar-panel.mp4)
  默认导出的视频文件。

## 使用流程

日常使用基本就是这 4 步：

1. 选择当前要用的视频数据文件
2. 修改数据内容和图片映射
3. 本地预览效果
4. 导出最终视频

## 一处切换当前视频

当前启用的视频配置写在 [data/videos/active-video.json](/E:/ai-list/ai-video/data/videos/active-video.json)：

```json
{
  "videoConfig": "/data/videos/delta-firestorm-sample.json"
}
```

如果你新建了一个别的数据文件，例如：

```json
{
  "videoConfig": "/data/videos/valorant-sample.json"
}
```

那么下面这些默认命令都会自动切过去，不需要再改别的地方：

- `npm run validate:sample`
- `npm run build:video`
- `npm run hf:inspect`
- `npm run hf:render`
- `npm run dev` 后打开的预览页

## 模板注册表

当前仓库已经从“单模板硬编码”升级成了“模板注册表 + 视频数据引用模板”结构。

模板索引在 [data/templates/registry.json](/E:/ai-list/ai-video/data/templates/registry.json)，例如：

```json
{
  "templates": [
    {
      "id": "operator-radar-landscape-v1",
      "manifestPath": "/data/templates/operator-radar-landscape-v1.json"
    }
  ]
}
```

模板 manifest 在 [data/templates/operator-radar-landscape-v1.json](/E:/ai-list/ai-video/data/templates/operator-radar-landscape-v1.json)，当前主要定义：

- 模板 `id`
- 模板 `family`
- 固定支持的雷达维度
- 预览尺寸和雷达参数
- 渲染尺寸、fps、模板 HTML 路径和雷达参数

当前这一步的价值是：

- 视频数据不再默认绑定唯一模板
- 构建和预览都从模板 manifest 读取关键参数
- 后续加第二套模板时，只需要新增 manifest 并登记到注册表

## 安装与环境

仓库依赖已经是本地工程依赖，不需要全局安装。

首次进入仓库后执行：

```bash
npm install
```

如果你只是在当前机器继续使用，通常直接运行命令即可。

## 常用命令

### 1. 启动预览页

```bash
npm run dev
```

默认会启动一个本地静态服务，通常是：

```text
http://127.0.0.1:4173/
```

预览页会自动读取 [data/videos/active-video.json](/E:/ai-list/ai-video/data/videos/active-video.json) 指向的视频配置。

如果你想临时预览某个 JSON，也可以直接带查询参数：

```text
http://127.0.0.1:4173/?video=/data/videos/delta-firestorm-sample.json
```

### 2. 校验当前视频数据

```bash
npm run validate:sample
```

这一步会校验：

- 标题和时长是否存在
- 雷达维度顺序是否正确
- 动画字段是否存在
- 每个条目的图片是否能解析
- 每个条目的六维分数是否合法

### 3. 生成视频 HTML 组合

```bash
npm run build:video
```

执行后会生成：

- [index.html](/E:/ai-list/ai-video/index.html)
- [meta.json](/E:/ai-list/ai-video/meta.json)

这两个文件是 HyperFrames 渲染前的中间产物。

### 4. 检查布局

```bash
npm run hf:inspect -- --samples 4
```

用于检查多个时间点的布局问题，确认没有溢出、裁切或错位。

### 5. 导出 MP4

```bash
npm run hf:render
```

默认输出到：

- [renders/radar-panel.mp4](/E:/ai-list/ai-video/renders/radar-panel.mp4)

## 视频数据怎么改

主要改 [data/videos/delta-firestorm-sample.json](/E:/ai-list/ai-video/data/videos/delta-firestorm-sample.json) 这一类文件。

一个典型结构如下：

```json
{
  "templateId": "operator-radar-landscape-v1",
  "meta": {
    "title": "烽火地带干员强度面板",
    "series": "delta-force",
    "topic": "operators",
    "durationPerItem": 5
  },
  "theme": {
    "background": "ember-grid",
    "radarAxes": ["信息", "机动", "压制", "生存", "功能", "难度"],
    "radarScaleMax": 9,
    "radarOverflowMax": 12
  },
  "animation": {
    "characterEnter": "slide-left-soft",
    "radarBuild": "scale-grow",
    "transition": "hard-cut"
  },
  "items": [
    {
      "id": "jifeng",
      "name": "疾风",
      "displayName": "张姐",
      "imageKey": "疾风",
      "scores": {
        "信息": 6.5,
        "机动": 11.2,
        "压制": 7.8,
        "生存": 8.7,
        "功能": 6.2,
        "难度": 8.9
      }
    }
  ]
}
```

### 关键字段说明

- `templateId`
  当前视频使用哪个模板。必须命中模板注册表中的 `id`。
- `meta.title`
  视频标题。
- `meta.durationPerItem`
  每个角色停留秒数。当前通常是 `5`。
- `theme.radarAxes`
  固定六维顺序，当前必须是：`信息 / 机动 / 压制 / 生存 / 功能 / 难度`。
- `theme.radarScaleMax`
  雷达图标准外圈的满值。
- `theme.radarOverflowMax`
  雷达图允许爆表的上限。
- `animation.characterEnter`
  人物入场动画。
- `animation.radarBuild`
  雷达图生长动画。
- `animation.transition`
  场景切换方式。
- `items[].displayName`
  左上角显示名，可写正式名，也可写外号。
- `items[].imageKey`
  图片映射键，推荐优先使用。
- `items[].scores`
  六维分数。

## 雷达图分数区间

当前仓库支持“外圈满值”和“爆表上限”分开设置。

例如：

```json
"radarScaleMax": 9,
"radarOverflowMax": 12
```

含义是：

- `0 - 9` 是正常雷达区间
- `9` 到最外环
- `9 - 12` 会继续冲出外圈，形成爆表效果

如果你不想出现爆表效果，可以把两个值设成一样，例如：

```json
"radarScaleMax": 10,
"radarOverflowMax": 10
```

## 图片怎么接入

图片本体放在 [assets/operators](/E:/ai-list/ai-video/assets/operators)。

映射表在 [data/assets/operator-image-map.json](/E:/ai-list/ai-video/data/assets/operator-image-map.json)，例如：

```json
{
  "疾风": "/assets/operators/jifeng.png",
  "张姐": "/assets/operators/jifeng.png",
  "蜂医": "/assets/operators/峰医.png"
}
```

程序会按下面顺序找图：

1. `items[].image`
2. `items[].imageKey`
3. `items[].displayName`
4. `items[].name`

推荐做法：

- 图片放到 `assets/operators`
- 在 `operator-image-map.json` 里补映射
- 在视频数据里写 `imageKey`

这样后面改显示名时，不容易把图跟丢。

## 新增一个视频配置的推荐步骤

如果你以后要做别的题材，比如《无畏契约》：

1. 复制一个现有 JSON，例如复制 [delta-firestorm-sample.json](/E:/ai-list/ai-video/data/videos/delta-firestorm-sample.json)
2. 改标题、角色列表、分数、动画参数
3. 把 `active-video.json` 里的 `videoConfig` 改到新文件
4. 执行 `npm run validate:sample`
5. 执行 `npm run dev` 预览
6. 执行 `npm run hf:render` 导出

## 新增一个模板的推荐步骤

如果你后面要新增第二套模板，例如“武器评分横版”：

1. 新建一个模板 manifest，例如 [data/templates/operator-radar-landscape-v1.json](/E:/ai-list/ai-video/data/templates/operator-radar-landscape-v1.json) 的副本
2. 修改 manifest 里的 `id`、尺寸、雷达参数、渲染模板路径
3. 在 [data/templates/registry.json](/E:/ai-list/ai-video/data/templates/registry.json) 中登记新的 `id` 和 `manifestPath`
4. 新建或复用对应的视频 HTML 模板
5. 在视频 JSON 中把 `templateId` 改成新的模板 id
6. 执行 `npm run validate:sample`
7. 执行 `npm run build:video`
8. 执行 `npm run hf:inspect`

当前实现仍然只支持 `operator-radar-panel` 这个模板 family，也就是同一类“人物 + 六维雷达”结构。注册表和 manifest 已经搭好，后续如果要支持完全不同的版式，再继续扩 preview/render family 即可。

## 当前默认输出参数

- 画幅：`1920x1080`
- 帧率：`30fps`
- 单角色默认时长：由 `meta.durationPerItem` 控制
- 输出文件： [renders/radar-panel.mp4](/E:/ai-list/ai-video/renders/radar-panel.mp4)

## 常见问题

### 为什么改了 JSON，预览没变化？

先确认两件事：

- 你改的是 [data/videos/active-video.json](/E:/ai-list/ai-video/data/videos/active-video.json) 当前指向的那个文件
- 浏览器打开的是最新的本地地址，且页面已刷新

### 为什么校验通过，但效果不理想？

`validate:sample` 只保证结构合法，不保证视觉效果最好。人物构图、分数夸张程度、显示名是否合适，还是要靠预览和成片检查。

### 为什么渲染时会提示 composition 太大？

当前 15 个角色都在一个组合里，渲染仍然是可用的，但 HyperFrames 可能提示：

- `composition_file_too_large`
- `timeline_track_too_dense`

这属于结构层面的提醒，不会阻止当前渲染。如果后面角色继续增加，可以再拆成多个子组合。

## 当前仓库最常改的 3 个地方

通常只需要关心这三处：

- [data/videos/active-video.json](/E:/ai-list/ai-video/data/videos/active-video.json)
  切换当前使用哪个视频数据文件
- [data/templates/registry.json](/E:/ai-list/ai-video/data/templates/registry.json)
  管理仓库中有哪些模板
- [data/videos/delta-firestorm-sample.json](/E:/ai-list/ai-video/data/videos/delta-firestorm-sample.json)
  改模板、标题、角色、分数、时长、动画
- [data/assets/operator-image-map.json](/E:/ai-list/ai-video/data/assets/operator-image-map.json)
  改干员图片映射
