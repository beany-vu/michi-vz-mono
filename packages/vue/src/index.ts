// Vue 3 wrapper over the @michi-vz/core engine. Takes the engine props as a
// single `options` object; mounts on `onMounted` (client-only, SSR-safe).
import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import {
  mountGapChart,
  mountLineChart,
  mountFanChart,
  mountAreaChart,
  mountScatterChart,
  mountVerticalStackBarChart,
  mountComparableHorizontalBarChart,
  mountComparableVerticalBarChart,
  mountDualHorizontalBarChart,
  mountBarBellChart,
  mountRangeChart,
  mountRibbonChart,
  mountRadarChart,
  mountTreemapChart,
  mountPieChart,
  mountBubbleChart,
  mountSankeyChart,
  mountFountainChart,
  mountChoroplethMapChart,
} from "@michi-vz/core";
import type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  ComparableVerticalBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethMapChartProps,
  ChartInstance,
  ChartContext,
} from "@michi-vz/core";

export type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  ComparableVerticalBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethMapChartProps,
  ChartContext,
} from "@michi-vz/core";

export const GapChart = defineComponent({
  name: "MichiVzGapChart",
  props: {
    options: { type: Object as PropType<GapChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<GapChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountGapChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 1000}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});

export const LineChart = defineComponent({
  name: "MichiVzLineChart",
  props: {
    options: { type: Object as PropType<LineChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<LineChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountLineChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 1000}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});

export const FanChart = defineComponent({
  name: "MichiVzFanChart",
  props: {
    options: { type: Object as PropType<FanChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<FanChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountFanChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 1000}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});

export const AreaChart = defineComponent({
  name: "MichiVzAreaChart",
  props: {
    options: { type: Object as PropType<AreaChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<AreaChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountAreaChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});

export const ScatterChart = defineComponent({
  name: "MichiVzScatterChart",
  props: {
    options: { type: Object as PropType<ScatterChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<ScatterChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountScatterChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});

export const VerticalStackBarChart = defineComponent({
  name: "MichiVzVerticalStackBarChart",
  props: {
    options: { type: Object as PropType<VerticalStackBarChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<VerticalStackBarChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountVerticalStackBarChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});

export const ComparableHorizontalBarChart = defineComponent({
  name: "MichiVzComparableHorizontalBarChart",
  props: {
    options: { type: Object as PropType<ComparableBarChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<ComparableBarChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountComparableHorizontalBarChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});

export const ComparableVerticalBarChart = defineComponent({
  name: "MichiVzComparableVerticalBarChart",
  props: {
    options: { type: Object as PropType<ComparableVerticalBarChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<ComparableVerticalBarChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountComparableVerticalBarChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});

export const DualHorizontalBarChart = defineComponent({
  name: "MichiVzDualHorizontalBarChart",
  props: {
    options: { type: Object as PropType<DualBarChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<DualBarChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountDualHorizontalBarChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});

export const BarBellChart = defineComponent({
  name: "MichiVzBarBellChart",
  props: {
    options: { type: Object as PropType<BarBellChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<BarBellChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountBarBellChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});

export const RangeChart = defineComponent({
  name: "MichiVzRangeChart",
  props: {
    options: { type: Object as PropType<RangeChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<RangeChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountRangeChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 1000}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});

export const RibbonChart = defineComponent({
  name: "MichiVzRibbonChart",
  props: {
    options: { type: Object as PropType<RibbonChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<RibbonChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountRibbonChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});

export const RadarChart = defineComponent({
  name: "MichiVzRadarChart",
  props: {
    options: { type: Object as PropType<RadarChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<RadarChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountRadarChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 600}px`,
          height: `${props.options.height ?? 600}px`,
        },
      });
  },
});

export const TreemapChart = defineComponent({
  name: "MichiVzTreemapChart",
  props: {
    options: { type: Object as PropType<TreemapChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<TreemapChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountTreemapChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 520}px`,
        },
      });
  },
});

export const PieChart = defineComponent({
  name: "MichiVzPieChart",
  props: {
    options: { type: Object as PropType<PieChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<PieChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountPieChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 600}px`,
          height: `${props.options.height ?? 420}px`,
        },
      });
  },
});

export const BubbleChart = defineComponent({
  name: "MichiVzBubbleChart",
  props: {
    options: { type: Object as PropType<BubbleChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<BubbleChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountBubbleChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 700}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});

export const SankeyChart = defineComponent({
  name: "MichiVzSankeyChart",
  props: {
    options: { type: Object as PropType<SankeyChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<SankeyChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountSankeyChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 800}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});

export const FountainChart = defineComponent({
  name: "MichiVzFountainChart",
  props: {
    options: { type: Object as PropType<FountainChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<FountainChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountFountainChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 800}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});

export const ChoroplethMapChart = defineComponent({
  name: "MichiVzChoroplethMapChart",
  props: {
    options: { type: Object as PropType<ChoroplethMapChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<ChoroplethMapChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountChoroplethMapChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 520}px`,
        },
      });
  },
});
