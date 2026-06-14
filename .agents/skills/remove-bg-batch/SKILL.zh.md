# remove-bg-batch 技能补充说明

这个 skill 用于批量去除图片背景，并输出透明背景的 `PNG` 文件。

## 默认目录

- 输入目录：`<skill-root>/input`
- 输出目录：`<skill-root>/output`

如果用户没有指定目录，就使用上面这两个默认目录。

如果用户明确指定了目录，就优先使用用户给定的输入和输出目录。

## 脚本位置

```text
<skill-root>/scripts/remove_bg_batch.py
```

## 默认运行方式

```bash
python scripts/remove_bg_batch.py
```

## 指定目录运行方式

```bash
python scripts/remove_bg_batch.py --input "D:\images" --output "D:\images-no-bg"
```

## 处理规则

- 支持递归扫描输入目录
- 支持格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.bmp`、`.tiff`
- 输出统一为透明背景的 `.png`
- 输出时保留原有子目录结构
- 如果某张图片失败，不要中断整个批次，继续处理其他图片
- 最后要汇总成功数、失败数和失败文件

## 依赖

需要安装：

```bash
pip install rembg
```

或者在 skill 根目录执行：

```bash
pip install -r requirements.txt
```

如果脚本提示缺少依赖，应明确告诉用户安装命令，而不是直接改写成别的实现。

## 适用请求示例

- “批量去掉这些图片背景”
- “处理默认目录里的图片”
- “把 `D:\raw-images` 里的图去背景，输出到 `D:\cutouts`”

## 分发说明

- 分发时应整体复制 `remove-bg-batch` 文件夹，而不是只复制脚本
- 需要保留目录结构：`SKILL.md`、`SKILL.zh.md`、`scripts/`、`input/`、`output/`、`requirements.txt`
- 脚本会根据自身所在位置推导默认目录，所以换到别的电脑或别的盘符后仍可使用
