import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountVerticalStackBarChart } from "@michi-vz/core";
import type { VerticalStackBarChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { VerticalStackBarChartProps } from "@michi-vz/core";

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
