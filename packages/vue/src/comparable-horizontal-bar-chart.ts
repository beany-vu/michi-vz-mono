import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountComparableHorizontalBarChart } from "@michi-vz/core";
import type { ComparableBarChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { ComparableBarChartProps } from "@michi-vz/core";

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
      { deep: true },
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
