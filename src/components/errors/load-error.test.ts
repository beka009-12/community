import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LoadError from "./LoadError";

describe("LoadError", () => {
  it("talks about the server, not the old data file", () => {
    const html = renderToStaticMarkup(
      createElement(LoadError, { title: "Не удалось загрузить страницу", retry: () => undefined }),
    );
    expect(html).toContain("Сервер не отвечает. Попробуйте ещё раз через минуту.");
    expect(html).not.toContain("файл данных");
  });
});
