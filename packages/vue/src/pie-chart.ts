import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountPieChart } from "@michi-vz/core";
import type { PieChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { PieChartProps } from "@michi-vz/core";

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
      { deep: true },
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
