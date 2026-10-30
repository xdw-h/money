# 存钱计划 Implementation Plan

> 在当前会话逐项执行，使用 executing-plans；不自动提交或推送。

**Goal:** 实现用户已确认的两种本地存钱计划及备份。

**Architecture:** 独立 savings 领域处理整数分校验、进度和事务写入；Vue 页面与弹层复用现有设计变量和日期组件；数据库版本升级与 ZIP 数据向后兼容。

**Tech Stack:** Vue 3、TypeScript、Dexie、Vitest、Playwright。

1. [x] 添加 `tests/unit/savings.spec.ts`，先运行 `npm test -- --run tests/unit/savings.spec.ts` 确认缺失实现，再创建 `src/features/savings/types.ts`、`savingsService.ts` 和数据库 v7。覆盖低于默认存款、超额进度、删除重算、到期及非法金额。
2. [x] 在 `tests/unit/backupService.spec.ts` 添加存钱往返和非法关联用例，先验证失败，再扩展 backup 类型、校验及事务。现有旧备份用例必须通过。检查设置页清空逻辑覆盖新增表。
3. [x] 添加 `tests/unit/SavingsPage.spec.ts` 验证创建与存入，先验证缺少页面，再实现列表、详情、计划表单、存入表单、首页入口和路由。默认金额预填并允许修改，保存期间防重复操作。
4. [x] 运行 `npm test -- --run`、`npm run build`，再用浏览器验证 375px 手机布局与刷新持久化。检查 `git diff --check` 和修改范围，保留已有未跟踪文档。
