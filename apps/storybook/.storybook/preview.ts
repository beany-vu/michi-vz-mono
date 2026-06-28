import "@michi-vz/wc"; // register every <michi-vz-*> element + auto-inject core.css
import type { Preview } from "@storybook/web-components";

const preview: Preview = {
  parameters: {
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    layout: "padded",
  },
};

export default preview;
