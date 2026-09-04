import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { handleConfirm } = vi.hoisted(() => ({
    handleConfirm: vi.fn((action: () => void) => action()),
}));

vi.mock("@/utils", () => ({
    handleConfirm,
    inIterationWarning: (action: () => void) => action(),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@cloud-materials/common/ve-o-iconbox", () => ({
    IconAiLine: () => null,
}));

vi.mock("@cloud-materials/common", () => {
    const Button = ({ children, ...props }: { children?: ReactNode }) => (
        <button {...props}>{children}</button>
    );
    const Dropdown = ({
        children,
        droplist,
    }: {
        children?: ReactNode;
        droplist?: ReactNode;
    }) => (
        <div>
            {children}
            {droplist}
        </div>
    );
    Dropdown.Button = ({
        children,
        droplist,
        onClick,
    }: {
        children?: ReactNode;
        droplist?: ReactNode;
        onClick?: () => void;
    }) => (
        <div>
            <button onClick={onClick}>{children}</button>
            {droplist}
        </div>
    );
    const Menu = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
    Menu.Item = ({
        children,
        onClick,
    }: {
        children?: ReactNode;
        onClick?: () => void;
    }) => <button onClick={onClick}>{children}</button>;

    return {
        Button,
        Dropdown,
        IconDelete: () => null,
        IconPlus: () => null,
        Input: { Search: () => null },
        Menu,
        Space: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
        Tree: () => null,
    };
});

import ApiList from "@/components/ApiManagement/ApiList";
import IterationActions from "@/components/ApiManagement/IterationActions";

afterEach(() => {
    cleanup();
    handleConfirm.mockClear();
});

const renderIterationActions = (
    overrides: Partial<ComponentProps<typeof IterationActions>> = {},
) => {
    const handlers = {
        handleStartIteration: vi.fn(),
        handleCompleteIteration: vi.fn(),
        handleDeleteIteration: vi.fn(),
    };

    render(
        <IterationActions
            inIteration={false}
            isLatest
            {...handlers}
            {...overrides}
        />,
    );
    return { ...handlers, ...overrides };
};

describe("IterationActions", () => {
    it("does not start an iteration when the entry button is clicked", async () => {
        const { handleStartIteration } = renderIterationActions();

        await userEvent.click(
            screen.getByRole("button", { name: "iteration.start" }),
        );

        expect(handleConfirm).not.toHaveBeenCalled();
        expect(handleStartIteration).not.toHaveBeenCalled();
    });

    it("starts the existing iteration flow from the current-version option", async () => {
        const { handleStartIteration } = renderIterationActions();

        await userEvent.click(
            screen.getByRole("button", {
                name: "iteration.startFromCurrentVersion",
            }),
        );

        expect(handleConfirm).toHaveBeenCalledOnce();
        expect(handleStartIteration).toHaveBeenCalledOnce();
    });

    it("keeps the OpenAPI import option without starting an iteration", async () => {
        const { handleStartIteration } = renderIterationActions();

        await userEvent.click(
            screen.getByRole("button", { name: "iteration.importOpenApi" }),
        );

        expect(handleStartIteration).not.toHaveBeenCalled();
    });

    it("shows the complete-iteration action during an iteration", async () => {
        const { handleCompleteIteration } = renderIterationActions({
            inIteration: true,
        });

        await userEvent.click(
            screen.getByRole("button", { name: "iteration.complete" }),
        );

        expect(handleCompleteIteration).toHaveBeenCalledOnce();
    });

    it("confirms before deleting the current iteration", async () => {
        const { handleDeleteIteration } = renderIterationActions({
            inIteration: true,
        });

        await userEvent.click(
            screen.getByRole("button", { name: "iteration.delete" }),
        );

        expect(handleConfirm).toHaveBeenCalledWith(
            handleDeleteIteration,
            "iteration.delete",
            "iteration.deleteConfirm",
        );
        expect(handleDeleteIteration).toHaveBeenCalledOnce();
    });
});

describe("ApiList", () => {
    it("shows the add-category action outside an iteration", async () => {
        const handleAddCategory = vi.fn();
        render(
            <ApiList
                inIteration={false}
                isLatest
                treeData={[{ key: "category-null", children: [{ key: "1" }] }]}
                selectedApiId={-1}
                setSelectedApiId={vi.fn()}
                handlers={{
                    handleAddApi: vi.fn(),
                    handleSmartCreateApi: vi.fn(),
                    handleAddCategory,
                    handleUpdateApiCategory: vi.fn(),
                    handleDeleteCategory: vi.fn(),
                }}
            />,
        );

        await userEvent.click(
            screen.getByRole("button", { name: "api.addCategory" }),
        );

        expect(handleAddCategory).toHaveBeenCalledOnce();
        expect(screen.queryByText("iteration.start")).not.toBeInTheDocument();
        expect(screen.queryByText("iteration.complete")).not.toBeInTheDocument();
    });

    it("shows the create API dropdown during an iteration", async () => {
        const handleAddApi = vi.fn();
        const handleSmartCreateApi = vi.fn();
        render(
            <ApiList
                inIteration
                isLatest
                treeData={[{ key: "category-null", children: [{ key: "1" }] }]}
                selectedApiId={-1}
                setSelectedApiId={vi.fn()}
                handlers={{
                    handleAddApi,
                    handleSmartCreateApi,
                    handleAddCategory: vi.fn(),
                    handleUpdateApiCategory: vi.fn(),
                    handleDeleteCategory: vi.fn(),
                }}
            />,
        );

        expect(
            screen.queryByRole("button", { name: "api.addCategory" }),
        ).not.toBeInTheDocument();

        await userEvent.click(
            screen.getByRole("button", { name: "api.create" }),
        );
        expect(handleAddApi).not.toHaveBeenCalled();

        await userEvent.click(
            screen.getByRole("button", { name: "api.manualCreate" }),
        );
        await userEvent.click(
            screen.getByRole("button", { name: "api.smartCreate" }),
        );

        expect(handleAddApi).toHaveBeenCalledOnce();
        expect(handleSmartCreateApi).toHaveBeenCalledOnce();
    });
});
