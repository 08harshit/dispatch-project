import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import Auth from "./Auth";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    session: null,
    loading: false,
  })),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

const renderAuth = (initialPath = "/auth") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Auth />
    </MemoryRouter>
  );
};

describe("Auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form by default", () => {
    renderAuth();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your Dispatch account")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("renders Forgot password link", () => {
    renderAuth();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("renders Sign up link", () => {
    renderAuth();
    expect(screen.getByText(/Don't have an account/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign up/i })).toBeInTheDocument();
  });

  it("renders Back to home link", () => {
    renderAuth();
    expect(screen.getByRole("link", { name: /Back to home/i })).toHaveAttribute("href", "/");
  });

  it("switches to forgot view when Forgot password is clicked", async () => {
    renderAuth();
    fireEvent.click(screen.getByText("Forgot password?"));

    await waitFor(() => {
      expect(screen.getByText("Reset password")).toBeInTheDocument();
      expect(screen.getByText("Enter your email and we'll send you a reset link")).toBeInTheDocument();
    });
  });

  it("switches to signup view when Sign up is clicked", async () => {
    renderAuth();
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Create account")).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });
  });
});
