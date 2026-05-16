import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ currentUser: { uid: "me" } }),
}));

import SuggestedUsers from "./SuggestedUsers";

describe("SuggestedUsers", () => {
  test("shows the empty state when there are no suggestions", () => {
    render(<SuggestedUsers users={[]} />);
    expect(screen.getByText("People you may know")).toBeInTheDocument();
    expect(
      screen.getByText(/suggest connections from your network/i)
    ).toBeInTheDocument();
  });

  test("renders a suggested user with mutual count", () => {
    render(
      <SuggestedUsers
        users={[{ uid: "u1", name: "Dana", mutuals: 3, interests: ["art"] }]}
      />
    );
    expect(screen.getByText("Dana")).toBeInTheDocument();
    expect(screen.getByText(/3 mutual connections/i)).toBeInTheDocument();
  });
});
