import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountComparableVerticalBarChart } from "@michi-vz/core";
import type { ComparableVerticalBarChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { ComparableVerticalBarChartProps } from "@michi-vz/core";

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
