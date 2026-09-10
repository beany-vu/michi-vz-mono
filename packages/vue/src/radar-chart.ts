import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountRadarChart } from "@michi-vz/core";
import type { RadarChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { RadarChartProps } from "@michi-vz/core";

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
      { deep: true },
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
