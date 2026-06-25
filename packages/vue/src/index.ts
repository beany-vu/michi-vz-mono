// Vue 3 wrapper over the @michi-vz/core engine. Takes the engine props as a
// single `options` object; mounts on `onMounted` (client-only, SSR-safe).
import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountGapChart } from "@michi-vz/core";
import type { GapChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { GapChartProps, ChartContext } from "@michi-vz/core";

export const GapChart = defineComponent({
  name: "MichiVzGapChart",
  props: {
    options: { type: Object as PropType<GapChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<GapChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountGapChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true }
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
