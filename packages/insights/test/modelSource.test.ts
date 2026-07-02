import { describe, it, expect } from "vitest";
import { applyModelSource, describeModelSource, DEFAULT_MODEL_HOST } from "../src/models/source";
import { SLM_PRESETS } from "../src/narrate";

describe("describeModelSource", () => {
  it("names huggingface.co explicitly as the default transformers source", () => {
    const d = describeModelSource("transformers", SLM_PRESETS.transformers.phi3);
    expect(DEFAULT_MODEL_HOST).toBe("https://huggingface.co");
    expect(d.host).toBe("https://huggingface.co");
    expect(d.url).toBe("https://huggingface.co/Xenova/Phi-3-mini-4k-instruct/resolve/main/");
    expect(d.downloads).toBe(true);
    expect(d.note.toLowerCase()).toContain("cache");
  });

  it("reflects a custom mirror host", () => {
    const d = describeModelSource("transformers", "Xenova/all-MiniLM-L6-v2", {
      remoteHost: "https://models.example.com",
    });
    expect(d.host).toBe("https://models.example.com");
    expect(d.url).toBe("https://models.example.com/Xenova/all-MiniLM-L6-v2/resolve/main/");
  });

  it("reflects a self-hosted local model path", () => {
    const d = describeModelSource("transformers", "my-model", {
      localModelPath: "/models/",
      allowRemoteModels: false,
    });
    expect(d.url).toBe("/models/my-model");
    expect(d.host).toBe("(self-hosted)");
    expect(d.note).toContain("no remote download");
  });

  it("remote backend downloads nothing - prompts go to the consumer's endpoint", () => {
    const d = describeModelSource("remote", undefined);
    expect(d.downloads).toBe(false);
    expect(d.note.toLowerCase()).toContain("your");
  });

  it("rules/hash backends download nothing", () => {
    expect(describeModelSource("rules", undefined).downloads).toBe(false);
    expect(describeModelSource("hash", undefined).downloads).toBe(false);
  });

  it("webllm names its source and supports appConfig self-hosting note", () => {
    const d = describeModelSource("webllm", SLM_PRESETS.webllm.phi3);
    expect(d.downloads).toBe(true);
    expect(d.note).toContain("appConfig");
  });
});

describe("applyModelSource", () => {
  function fakeEnv() {
    return {
      env: {
        remoteHost: "https://huggingface.co",
        remotePathTemplate: "{model}/resolve/{revision}/",
        allowRemoteModels: true,
        allowLocalModels: false,
        localModelPath: "/models/",
      },
    };
  }

  it("points Transformers.js at a mirror host", () => {
    const mod = fakeEnv();
    applyModelSource(mod, { remoteHost: "https://models.example.com" });
    expect(mod.env.remoteHost).toBe("https://models.example.com");
    expect(mod.env.allowRemoteModels).toBe(true);
  });

  it("wires a self-hosted local path and can forbid remote downloads", () => {
    const mod = fakeEnv();
    applyModelSource(mod, { localModelPath: "/my-models/", allowRemoteModels: false });
    expect(mod.env.localModelPath).toBe("/my-models/");
    expect(mod.env.allowLocalModels).toBe(true);
    expect(mod.env.allowRemoteModels).toBe(false);
  });

  it("is a safe no-op for a module without env or an empty source", () => {
    expect(() => applyModelSource({}, { remoteHost: "https://x" })).not.toThrow();
    const mod = fakeEnv();
    applyModelSource(mod, undefined);
    expect(mod.env.remoteHost).toBe("https://huggingface.co");
  });
});
