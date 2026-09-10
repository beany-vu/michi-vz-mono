import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountRangeChart } from "@michi-vz/core";
import type { RangeChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { RangeChartProps } from "@michi-vz/core";

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
      { deep: true },
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
