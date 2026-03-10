import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { StatCard } from "./StatCard";
import { Truck } from "lucide-react";

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("StatCard", () => {
  it("renders title and value", () => {
    renderWithRouter(
      <StatCard title="Total Couriers" value={42} icon={Truck} />
    );
    expect(screen.getByText("Total Couriers")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders as link when to prop is provided", () => {
    renderWithRouter(
      <StatCard title="Couriers" value={10} icon={Truck} to="/couriers" />
    );
    const link = screen.getByRole("link", { name: /Couriers/ });
    expect(link).toHaveAttribute("href", "/couriers");
  });

  it("renders without link when to prop is not provided", () => {
    renderWithRouter(
      <StatCard title="Stats" value="99%" icon={Truck} />
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("99%")).toBeInTheDocument();
  });

  it("renders trend when provided", () => {
    renderWithRouter(
      <StatCard
        title="Growth"
        value={100}
        icon={Truck}
        trend={{ value: 12, isPositive: true }}
      />
    );
    expect(screen.getByText("12%")).toBeInTheDocument();
  });
});
