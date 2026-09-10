import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountGaugeChart } from "@michi-vz/core";
import type { GaugeChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { GaugeChartProps } from "@michi-vz/core";

export const GaugeChart = defineComponent({
  name: "MichiVzGaugeChart",
  props: {
    options: { type: Object as PropType<GaugeChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<GaugeChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountGaugeChart(host.value, props.options);
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
          width: `${props.options.width ?? 300}px`,
          height: `${props.options.height ?? 300}px`,
        },
      });
  },
});
