import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import type { GraphData } from "@/types/graph";
import GraphView from "./GraphView";

// Replace next/dynamic with a stub ForceGraph that exposes onLinkClick via a
// button, so we never load the canvas-based react-force-graph in jsdom.
vi.mock("next/dynamic", () => ({
  default: () =>
    function FakeForceGraph(props: {
      onLinkClick: (link: unknown) => void;
      graphData: GraphData;
    }) {
      return (
        <button
          type="button"
          data-testid="fake-graph"
          onClick={() => props.onLinkClick({ relation_type: "supports" })}
        >
          graph:{props.graphData.nodes.length}
        </button>
      );
    },
}));

let widthSpy: MockInstance;
let heightSpy: MockInstance;

beforeAll(() => {
  // jsdom has no ResizeObserver and reports 0 layout sizes; provide both so the
  // graph branch (which requires width > 0) can render.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb;
      }
      observe() {
        this.cb([], this as unknown as ResizeObserver);
      }
      disconnect() {}
      unobserve() {}
    },
  );
  widthSpy = vi
    .spyOn(HTMLElement.prototype, "clientWidth", "get")
    .mockReturnValue(800);
  heightSpy = vi
    .spyOn(HTMLElement.prototype, "clientHeight", "get")
    .mockReturnValue(600);
});

afterAll(() => {
  widthSpy.mockRestore();
  heightSpy.mockRestore();
  vi.unstubAllGlobals();
});

const empty: GraphData = { nodes: [], links: [] };
const populated: GraphData = {
  nodes: [
    { id: "a", title: "A", content: null, type: "concept" },
    { id: "b", title: "B", content: null, type: "fact" },
  ],
  links: [{ id: "e1", source: "a", target: "b", relation_type: "supports" }],
};

describe("GraphView", () => {
  it("shows an empty state when there are no nodes", () => {
    render(<GraphView data={empty} />);
    expect(
      screen.getByText(
        "No nodes yet. Create the first one using the form on the left.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("fake-graph")).not.toBeInTheDocument();
  });

  it("renders the graph when nodes are present", () => {
    render(<GraphView data={populated} />);
    expect(screen.queryByText(/No nodes yet/)).not.toBeInTheDocument();
    expect(screen.getByTestId("fake-graph")).toHaveTextContent("graph:2");
  });

  it("opens an edge detail panel on link click and closes it", async () => {
    render(<GraphView data={populated} />);
    await userEvent.click(screen.getByTestId("fake-graph"));

    expect(screen.getByText("Edge")).toBeInTheDocument();
    expect(screen.getByText("supports")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Edge")).not.toBeInTheDocument();
  });
});
