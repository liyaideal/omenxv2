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
    </div>
  </SectionWrapper>
);

export default LiteSportsLiveSection;
