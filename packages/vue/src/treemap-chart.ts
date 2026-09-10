import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountTreemapChart } from "@michi-vz/core";
import type { TreemapChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { TreemapChartProps } from "@michi-vz/core";

export const TreemapChart = defineComponent({
  name: "MichiVzTreemapChart",
  props: {
    options: { type: Object as PropType<TreemapChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<TreemapChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountTreemapChart(host.value, props.options);
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
