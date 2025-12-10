# DawnTags
一个基于[LiteBlog](https://github.com/Unicode01/LiteBlog)的简洁的导航页主题,旨在演示LiteBlog的功能、特性和强大的自定义能力.
## Before using
为了完整使用该主题,避免出现未知的兼容性问题,需要强制以下几个设置.
---
- `configs/config.json`:
- `sniffer_config`
- - `enabled`: `true`
- - `public_provider`: `"/sniffer"`
- `contentAdvisor_config`
- - `filter_article`: `false`
---
支持的卡片类型:
- `card_template_classical` // 经典卡片
- `card_template_split_line` // 分类分割线
- `card_template_search_bar` // 搜索栏