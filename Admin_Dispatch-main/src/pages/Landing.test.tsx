import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Landing from "./Landing";

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Landing", () => {
  it("renders hero section with main headline", () => {
    renderWithRouter(<Landing />);
    expect(screen.getByText(/Streamline Your/i)).toBeInTheDocument();
    expect(screen.getByText(/Vehicle Transport/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Operations/i).length).toBeGreaterThan(0);
  });

  it("renders Dispatch brand in navbar", () => {
    renderWithRouter(<Landing />);
    expect(screen.getAllByText("Dispatch").length).toBeGreaterThan(0);
  });

  it("renders feature sections", () => {
    renderWithRouter(<Landing />);
    expect(screen.getByText("Courier Management")).toBeInTheDocument();
    expect(screen.getByText("Shipper Management")).toBeInTheDocument();
    expect(screen.getByText("Load Tracking")).toBeInTheDocument();
    expect(screen.getByText("Compliance Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Analytics & Reporting")).toBeInTheDocument();
    expect(screen.getByText("Document Management")).toBeInTheDocument();
  });

  it("renders stats strip", () => {
    renderWithRouter(<Landing />);
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("10K+")).toBeInTheDocument();
    expect(screen.getByText("Loads Managed")).toBeInTheDocument();
  });

  it("renders CTA links to auth", () => {
    renderWithRouter(<Landing />);
    const authLinks = screen.getAllByRole("link").filter(
      (el) => el.getAttribute("href") === "/auth"
    );
    expect(authLinks.length).toBeGreaterThan(0);
  });

  it("renders ticketing section", () => {
    renderWithRouter(<Landing />);
    expect(screen.getByText("Integrated Ticketing System")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Resolved")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });
});
