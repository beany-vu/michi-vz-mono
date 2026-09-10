import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountScatterChart } from "@michi-vz/core";
import type { ScatterChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { ScatterChartProps } from "@michi-vz/core";

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
