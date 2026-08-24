# Portfolio · AUTO-CLOSE / IF WINS 列补全（Boost 空白修复）

## 现状（已核查代码）

这一列在 `LiveCards.tsx` 里是**二选一**的合并列：

- Standard 段：`If {side} wins → $X`（X = `ifWins` = 合约张数，结算按 $1/张）。
- Boost 段：只显示 `≈{auto-close}¢ · now {价}`，注释明确写着 "A Boost row never shows an if-wins amount."

Boost 现在全空的原因在 `useLitePortfolio.ts`：auto-close 用的是**账户级**解方程（`estimateAutoClosePrice`，mode `existing`），账户越安全解出的触发价越低；一旦 ≤ 0 或 > 当前价，`safeAutoClose` 就被置 null，UI 直接不渲染任何东西 → 整列空白。也就是说"账户安全"这个正常状态目前被表现成"没数据"。

同时，交易页早在 R3b-2 round 5 (W2) 就定了规矩："Est. auto-close 永不消失"，无解时显示 `None at this balance`。Portfolio 这一列没跟上这条规矩，这是漂移。

## 要做的改动

1. **Boost 行也显示 if-wins。** Boost 合约赢了同样按张数 × $1 结算，`ifWins` 字段已经算好了，只是被刻意屏蔽。改为 Boost 行主句为 `If {side} wins → $X`。
2. **auto-close 作为第二段补在同一格里**，并遵循 W2 的四态文案：
   - 有解：`· auto-close ≈{c}¢`
   - 1×（无 Boost）：不显示第二段
   - 账户很安全、当前余额下解不出：`· no auto-close at this balance`
   - 缺数据：`· auto-close —`
3. 移动卡片 `sentence` 与桌面 `mergedCol` 用同一套 helper，保持两端文案一致（移动端仍用长句式 "If … you get …／Auto-closes if price hits …"）。
4. `hot` 红色高亮逻辑不变（仍只在有解且距离 ≤10% 时触发）。
5. 在 `/style-guide` Portfolio 区补齐这一列的四种状态预设（Standard／Boost 有解／Boost 无解／Boost 1×），符合 playground 穷尽状态规矩。
6. 更新 `docs/copy-dictionary.md` 收录 `no auto-close at this balance` 这条文案。

## 技术细节

- 改动文件：`src/components/portfolio/lite/LiveCards.tsx`（渲染与文案）、`src/pages/StyleGuide*` 对应 Portfolio section、`docs/copy-dictionary.md`。
- `useLitePortfolio.ts` 只需把"无解"与"1×"两种情形区分开（新增一个 `autoCloseState: 'none' | 'unsolved' | 'level'` 之类的判别），不改任何 PnL / 保证金公式。
- 不动 `estimateAutoClosePrice` 的数学。
