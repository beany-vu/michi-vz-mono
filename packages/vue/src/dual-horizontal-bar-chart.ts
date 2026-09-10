import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountDualHorizontalBarChart } from "@michi-vz/core";
import type { DualBarChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { DualBarChartProps } from "@michi-vz/core";

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
