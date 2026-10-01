/**
 * Tests for the triangle page, driven the way a user drives it.
 *
 * The page and its real adapter (`useGeometryAdapter`) and the real in-process
 * client bus are exercised together. Only the server action — the boundary
 * call into the core across the network — is replaced, so each test controls
 * when and how the "server" answers.
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { RightTriangle } from "@csikosbalint/webapp-platform-core/ports";

import Page from "../app/page";
import { solveTriangle } from "../app/math.actions";

vi.mock("../app/math.actions", () => ({ solveTriangle: vi.fn() }));

const solve = vi.mocked(solveTriangle);

/** What the real core would answer for two legs. */
function triangle(legA: number, legB: number): RightTriangle {
  const hypotenuse = Math.hypot(legA, legB);
  return {
    legA,
    legB,
    hypotenuse,
    area: (legA * legB) / 2,
    perimeter: legA + legB + hypotenuse,
  };
}

/** A promise the test resolves or rejects by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const solveButton = () => screen.getByRole("button", { name: /solve|calculating/i });
const feedItems = () =>
  within(screen.getByRole("region", { name: "Event feed" })).getAllByRole("listitem");

beforeEach(() => {
  solve.mockReset();
});

afterEach(() => {
  // Unmounting unsubscribes the adapter from the module-scoped client bus.
  cleanup();
});

test("renders the form with default legs and empty result and feed", () => {
  render(<Page />);

  expect(screen.getByRole("heading", { level: 1, name: "Right triangle solver" })).toBeDefined();
  expect((screen.getByLabelText("Leg A") as HTMLInputElement).value).toBe("3");
  expect((screen.getByLabelText("Leg B") as HTMLInputElement).value).toBe("4");
  expect(screen.getByText("No result yet.")).toBeDefined();
  expect(screen.getByText("No events yet.")).toBeDefined();
  expect(solveButton().getAttribute("aria-busy")).toBe("false");
});

test("shows a busy button until the presenter receives the result", async () => {
  const answer = deferred<RightTriangle>();
  solve.mockReturnValue(answer.promise);
  const user = userEvent.setup();
  render(<Page />);

  await user.click(solveButton());

  // Sent, not yet received: the button is busy and disabled, with a status.
  const busy = solveButton() as HTMLButtonElement;
  expect(busy.disabled).toBe(true);
  expect(busy.getAttribute("aria-busy")).toBe("true");
  expect(screen.getByRole("status").textContent).toBe("Calculating");
  expect(solve).toHaveBeenCalledWith(3, 4);

  answer.resolve(triangle(3, 4));

  expect(await screen.findByText("geometry.triangle.completed · hypotenuse 5")).toBeDefined();
  const idle = solveButton() as HTMLButtonElement;
  expect(idle.disabled).toBe(false);
  expect(idle.getAttribute("aria-busy")).toBe("false");
  expect(screen.queryByRole("status")).toBeNull();
});

test("shows the solved values for the typed legs", async () => {
  solve.mockImplementation(async (a, b) => triangle(a, b));
  const user = userEvent.setup();
  render(<Page />);

  await user.clear(screen.getByLabelText("Leg A"));
  await user.type(screen.getByLabelText("Leg A"), "8");
  await user.clear(screen.getByLabelText("Leg B"));
  await user.type(screen.getByLabelText("Leg B"), "15");
  await user.click(solveButton());

  expect(solve).toHaveBeenCalledWith(8, 15);
  expect(await screen.findByText("17")).toBeDefined(); // hypotenuse
  expect(screen.getByText("60")).toBeDefined(); // area
  expect(screen.getByText("40")).toBeDefined(); // perimeter
  expect(screen.queryByText("No result yet.")).toBeNull();
});

test("shows the error and a FAILED feed line when the server rejects", async () => {
  solve.mockRejectedValue(new RangeError("legA must be a finite number greater than 0"));
  const user = userEvent.setup();
  render(<Page />);

  await user.click(solveButton());

  expect(
    await screen.findByText("legA must be a finite number greater than 0", { selector: "p" }),
  ).toBeDefined();
  expect(feedItems()[0]?.textContent).toBe(
    "geometry.triangle.failed · legA must be a finite number greater than 0",
  );
  expect((solveButton() as HTMLButtonElement).disabled).toBe(false);
});

test("keeps only the 10 newest feed lines, newest on top", async () => {
  solve.mockImplementation(async (a, b) => triangle(a, b));
  const user = userEvent.setup();
  render(<Page />);
  const legA = screen.getByLabelText("Leg A");
  const legB = screen.getByLabelText("Leg B");

  // With legB = 0 the mocked server answers hypotenuse = n, so every run is
  // identifiable in the feed. (The real core would reject 0; the mock does not.)
  await user.clear(legB);
  await user.type(legB, "0");

  for (let n = 1; n <= 11; n += 1) {
    await user.clear(legA);
    await user.type(legA, String(n));
    await user.click(solveButton());
    await screen.findByText(`geometry.triangle.completed · hypotenuse ${n}`);
  }

  const lines = feedItems().map((item) => item.textContent);
  expect(lines).toHaveLength(10);
  expect(lines[0]).toBe("geometry.triangle.completed · hypotenuse 11");
  expect(lines[9]).toBe("geometry.triangle.completed · hypotenuse 2");
});
