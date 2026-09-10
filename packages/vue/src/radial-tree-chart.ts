import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountRadialTreeChart } from "@michi-vz/core";
import type { RadialTreeChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { RadialTreeChartProps } from "@michi-vz/core";

export const RadialTreeChart = defineComponent({
  name: "MichiVzRadialTreeChart",
  props: {
    options: { type: Object as PropType<RadialTreeChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<RadialTreeChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountRadialTreeChart(host.value, props.options);
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
          height: `${props.options.height ?? 520}px`,
        },
      });
  },
});
