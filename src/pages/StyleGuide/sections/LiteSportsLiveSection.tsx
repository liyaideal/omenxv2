/**
 * Lite Sports · Live —— LiveMatchboard 与 LiveStage 的全状态字典。
 * 每个 case = 生产组件 + 手写 fixture event；桌面 1280 帧在上，移动 375 帧在下。
 */
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../components/SectionFrame";

const BOARD_CASES: SectionCase[] = [
  {
    key: "sports-live-m1",
    label: "M1 · CS2 进行中（Map 2）",
    spec: [
      {
        state: "live",
        when: "isFixtureLive(event) && segment_index != null && segment_results[idx-1] != null",
        visual: "LIVE 药丸 + `IEM Cologne · Map 2`，M2 列高亮，右上写该图当前比分",
        source: "buildModel status / idx",
      },
    ],
  },
  {
    key: "sports-live-m2",
    label: "M2 · 未开赛",
    spec: [
      {
        state: "upcoming",
        when: "!live && kickoff > now",
        visual: "UPCOMING 灰药丸，右上 `Starts in 2h 14m`，全部格子 `·`",
        source: "buildModel status = upcoming",
      },
    ],
  },
  {
    key: "sports-live-m3",
    label: "M3 · 换图间歇",
    spec: [
      {
        state: "break",
        when: "live && idx > 1 && segment_results[idx-1] == null",
        visual: "BREAK 药丸 + `IEM Cologne · Map 2 starting`，右上 `—`",
        source: "buildModel inBreak",
      },
    ],
  },
  {
    key: "sports-live-m4",
    label: "M4 · 已结束待核对",
    spec: [
      {
        state: "finished",
        when: "!live && !is_resolved && kickoff <= now",
        visual: "FINISHED 药丸 + 右上 `In review · result pending` 橙边徽章",
        source: "buildModel status = finished",
      },
    ],
  },
  {
    key: "sports-live-m5",
    label: "M5 · 已结算",
    spec: [
      {
        state: "settled",
        when: "is_resolved === true",
        visual: "整块 opacity .6，右上 SETTLED 灰药丸，比分定格",
        source: "buildModel status = settled",
      },
    ],
  },
  {
    key: "sports-live-m6",
    label: "M6 · 表外赛事退化",
    spec: [
      {
        state: "no spec",
        when: "SPORT_SEGMENTS[segments_key] === undefined",
        visual: "只剩队名列与 maps 总数列，分段矩阵整块不渲染",
        source: "buildModel spec === undefined",
      },
    ],
  },
  {
    key: "sports-live-u1",
    label: "U1 · UFC 进行中（Round 3）",
    spec: [
      {
        state: "live · mma",
        when: 'sport === "mma" && phase === "ROUND"',
        visual: "无 totals 列，R3 高亮为 ●，右上橙色回合钟 `2:30`，封分说明常驻",
        source: "buildModel isMma / clock",
      },
    ],
  },
  {
    key: "sports-live-u2",
    label: "U2 · 回合间歇",
    spec: [
      {
        state: "break · mma",
        when: 'sport === "mma" && phase === "BREAK"',
        visual: "BREAK 药丸 + `UFC 321 · Between rounds`，右上 `—`",
        source: "buildModel inBreak（MMA 分支）",
      },
    ],
  },
  {
    key: "sports-live-u3",
    label: "U3 · 未开赛",
    spec: [
      {
        state: "upcoming · mma",
        when: "!live && kickoff > now && total > 0",
        visual: "上下文行写 `UFC 321 · 5 rounds`，右上 `Starts in …`",
        source: "buildModel ctx（F4 分支）",
      },
    ],
  },
  {
    key: "sports-live-u4",
    label: "U4 · 已结算（第 2 回合 KO）",
    note: "本节最重要的一态：W/L 只允许出现在结束回合那一格。线上永远等不到。",
    spec: [
      {
        state: "settled · mma",
        when: "is_resolved && idx === 2 && winning_option_id 以 -o1 结尾",
        visual: "R1 `·`（打过未公布）｜R2 主 `W` #CFFF4A / 客 `L` #5B6270｜R3–R5 `—` #3D444C",
        source: "rowCells MMA settled 三分支",
      },
    ],
  },
  {
    key: "sports-live-m7",
    label: "M7 · 移动 sticky 记分条（滚过内联条后吸顶）",
    note:
      "生产里由 IntersectionObserver 决定：内联条滚出视口才吸顶，吸顶后高 45（内联 62），比分字号 18 → 16。字典用 fixture-only prop `fixtureSticky` 强制常显；它是 viewport 级 position:fixed，因此必须独占一帧——多个 case 同帧会全部叠在同一位置。",
    spec: [
      { state: "未吸顶", when: "sentinel.isIntersecting === true", visual: "只有内联 62 高的条，无 fixed 层", source: "LiveMatchboard.stuck" },
      { state: "已吸顶", when: "sentinel.isIntersecting === false", visual: "内联条保留占位，另有一条 45 高的条 fixed 在 `top: var(--mobile-header-h)`", source: "LiveMatchboard 移动分支" },
      { state: "字典强制", when: "fixtureSticky === true（生产从不传）", visual: "同上，且不依赖滚动", source: "fixtureSticky（fixture-only）" },
    ],
  },
  {
    key: "sports-live-f1",
    label: "F1 · 足球 · 两个半场（进行中，下半场 63′）",
    note:
      "足球库里没有 segments_key，走 SPORT_FALLBACK.soccer；当前半场由分钟推（>45 即 2H）。大数字是两个半场进球之和（totalsRule: \"sum\"），不是赢下的段数；totals 表头词是 goals，不是 maps。右上是比赛分钟 63′，不是段内比分。",
    spec: [
      { state: "两列半场", when: "spec.unit === \"half\"", visual: "列头 `1H` `2H`，列宽 70px，格子是该半场进的球", source: "SPORT_FALLBACK.soccer" },
      { state: "当前半场", when: "n === idx", visual: "该列顶部一条橙线 + 极淡橙底（全牌唯一的当前位标记）", source: "headStyle(on) / cellStyle(now)" },
      { state: "大数字", when: "totalsRule === \"sum\"", visual: "各半场进球相加，表头词 `goals`", source: "buildModel totals" },
      { state: "右上分钟", when: "rightValue === \"minute\" && status === \"live\"", visual: "`63′`（U+2032），钳在 1…90", source: "buildModel rightValue" },
      { state: "无中场态", when: "spec.unit === \"half\"", visual: "不进 BREAK；中场休息本轮不做", source: "buildModel inBreak" },
    ],
  },
  {
    key: "sports-live-f2",
    label: "F2 · 足球 · 未开赛",
    spec: [
      { state: "未开赛", when: "kickoff > now && !is_resolved", visual: "UPCOMING 药丸 + 联赛 + `Starts in {…}`，goals 0 / 0，两列全是点", source: "buildModel status/upcoming" },
      { state: "无当前列", when: "idx == null", visual: "没有任何一列高亮", source: "colHighlight" },
    ],
  },
];

const STAGE_CASES: SectionCase[] = [
  {
    key: "sports-stage-s1",
    label: "S1 · playing",
    note: "本轮播控只有静音一枚；画中画 / 全屏 / 迷你播放器推迟到 SP-L3b。",
    spec: [
      {
        state: "playing",
        when: 'useHlsVideo state === "playing"',
        visual: "中央暂停键（桌面 56 / 移动 44），右下延迟说明 + 28×28 静音键",
        source: "LiveStage s === playing",
      },
    ],
  },
  {
    key: "sports-stage-s2",
    label: "S2 · loading",
    spec: [{ state: "loading", when: "manifest 尚未解析", visual: "34px 橙顶转圈，无中央按钮", source: "Ring size 34" }],
  },
  {
    key: "sports-stage-s3",
    label: "S3 · buffering",
    spec: [
      {
        state: "buffering",
        when: "waiting/stalled 持续 > 1500ms",
        visual: "26px 转圈 + 底部 `BUFFERING`",
        source: "BUFFER_GRACE_MS",
      },
    ],
  },
  {
    key: "sports-stage-s4",
    label: "S4 · paused",
    spec: [
      {
        state: "paused",
        when: "用户点了暂停",
        visual: "中央播放三角 + 底部 `PAUSED · BEHIND LIVE`；恢复时跳回直播边缘",
        source: "useHlsVideo play()",
      },
    ],
  },
  {
    key: "sports-stage-s5",
    label: "S5 · blocked",
    spec: [
      {
        state: "blocked",
        when: "浏览器自动播放策略拒绝 play()",
        visual: "橙底播放键 + 底部 `TAP TO PLAY`",
        source: "play() reject",
      },
    ],
  },
  {
    key: "sports-stage-s6",
    label: "S6 · prekick",
    spec: [
      {
        state: "prekick",
        when: "!live && kickoff > now",
        visual: "暗底 #0C0F13，`Stream starts at kickoff` + `in 2h 14m`，无药丸无播控",
        source: "LiveStage prekick",
      },
    ],
  },
  {
    key: "sports-stage-s7",
    label: "S7 · error",
    spec: [
      {
        state: "error",
        when: "fatal hls error 或停滞 > 10s",
        visual: "暗底，`Stream unavailable` + `Scores keep updating below`",
        source: "STALL_FAIL_MS / Hls.Events.ERROR",
      },
    ],
  },
  {
    key: "sports-stage-s8",
    label: "S8 · forbidden",
    spec: [
      {
        state: "forbidden",
        when: "manifest 返回 403",
        visual: "暗底，`Not available in your region` + `Scores keep updating below`",
        source: "data.response.code === 403",
      },
    ],
  },
  {
    key: "sports-stage-s9",
    label: "S9 · finished",
    note: "生产里这一态就是「舞台整块 return null」，此处仅为字典可读性渲染说明卡。",
    spec: [
      {
        state: "finished",
        when: "is_resolved || end_date <= now || 无 stream_url",
        visual: "生产：LiveStage 返回 null，记分牌留在原位",
        source: "LiveStage 早退分支",
      },
    ],
  },
];

const MINI_CASES: SectionCase[] = [
  {
    key: "sports-mini-c1",
    label: "C1 · 迷你窗（CS2 播放中）",
    note: "同一个 <video> 换位置，不卸载重挂；舞台离开视口才出现，移动端不出现。",
    spec: [
      {
        state: "mini",
        when: "有源 && live && 占位离开视口 && 未关闭 && 非全屏 && 桌面",
        visual: "300×229：把手 20 + 画面 169 + 动作条 40；右上胶囊 `M2 · 9–7`",
        source: "LiveStage mode === mini",
      },
    ],
  },
  {
    key: "sports-mini-c2",
    label: "C2 · 迷你窗（UFC 无比分）",
    spec: [
      {
        state: "mini · mma",
        when: 'sport === "mma"',
        visual: "胶囊写 `R3 · 2:15`（回合钟），不写比分",
        source: "metadata.clock",
      },
    ],
  },
  {
    key: "sports-mini-c3",
    label: "C3 · 全屏底栏（S10）",
    spec: [
      {
        state: "fullscreen",
        when: "wrapper.requestFullscreen()",
        visual:
          "左上完整比分串；底栏左延迟披露、右两枚 Series winner 芯片（#33D6FF / #CFFF4A）",
        source: "LiveStage chrome === full",
      },
    ],
  },
  {
    key: "sports-mini-c4",
    label: "C4 · 记分牌 Watch 键（S11）",
    spec: [
      {
        state: "watch",
        when: "hasSource && !inlineVisible && miniDismissed",
        visual: "顶栏 spacer 之后、状态徽标之前一枚 `▶ Watch` 键",
        source: "useShowWatchKey(event.id)",
      },
    ],
  },
];

const Pair = ({ cases, min }: { cases: SectionCase[]; min?: number }) => (
  <>
    <SectionFrame cases={cases} device="desktop" minHeight={min ?? 520} />
    <div className="mt-3">
      <SectionFrame cases={cases} device="mobile" minHeight={min ?? 520} />
    </div>
  </>
);

const byKey = (list: SectionCase[], ...keys: string[]): SectionCase[] =>
  keys.map((k) => {
    const hit = list.find((c) => c.key === k);
    if (!hit) throw new Error(`LiteSportsLiveSection: unknown case key ${k}`);
    return hit;
  });

export const LiteSportsLiveSection = () => (
  <SectionWrapper id="lite-sports-live" title="Lite Sports · Live" platform="shared">
    <div className="space-y-8">
      <SubSection title="Ⓐ LiveMatchboard（M1 … M6 · U1 … U4）">
        <Pair
          cases={byKey(
            BOARD_CASES,
            "sports-live-m1",
            "sports-live-m2",
            "sports-live-m3",
            "sports-live-m4",
            "sports-live-m5",
            "sports-live-m6",
            "sports-live-u1",
            "sports-live-u2",
            "sports-live-u3",
            "sports-live-u4",
          )}
          min={1400}
        />
      </SubSection>

      <SubSection title="Ⓐ′ LiveMatchboard · M7（移动 sticky 记分条，独占一帧）">
        <Pair cases={byKey(BOARD_CASES, "sports-live-m7")} min={420} />
      </SubSection>

      <SubSection title="Ⓑ LiveStage（S1 … S9）">
        <Pair
          cases={byKey(
            STAGE_CASES,
            "sports-stage-s1",
            "sports-stage-s2",
            "sports-stage-s3",
            "sports-stage-s4",
            "sports-stage-s5",
            "sports-stage-s6",
            "sports-stage-s7",
            "sports-stage-s8",
            "sports-stage-s9",
          )}
          min={2600}
        />
      </SubSection>

      <SubSection title="Ⓒ LiveMiniPlayer / 全屏 / Watch 键">
        <Pair
          cases={byKey(
            MINI_CASES,
            "sports-mini-c1",
            "sports-mini-c2",
            "sports-mini-c3",
            "sports-mini-c4",
          )}
          min={1200}
        />
      </SubSection>
    </div>
  </SectionWrapper>
);

export default LiteSportsLiveSection;
