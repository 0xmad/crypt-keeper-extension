/**
 * @jest-environment jsdom
 */

import { act, render, screen, fireEvent } from "@testing-library/react";
import { useNavigate } from "react-router-dom";

import { mockDefaultConnection, mockDefaultIdentity } from "@src/config/mock/zk";
import { Paths } from "@src/constants";
import { redirectToNewTab, replaceUrlParams } from "@src/util/browser";

import { IdentityItem, IdentityItemProps } from "../Item";

jest.mock("react-router-dom", (): unknown => ({
  useNavigate: jest.fn(),
}));

describe("ui/components/IdentityList/Item", () => {
  const defaultProps: IdentityItemProps = {
    isShowMenu: true,
    commitment: "1",
    selected: "0",
    connectedOrigin: mockDefaultConnection.urlOrigin,
    metadata: mockDefaultIdentity.metadata,
    onDeleteIdentity: jest.fn(),
    onSelectIdentity: jest.fn(),
    onUpdateIdentityName: jest.fn(),
  };

  const mockNavigate = jest.fn();

  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should render properly", async () => {
    render(<IdentityItem {...defaultProps} isShowMenu={false} />);

    const name = await screen.findByText(defaultProps.metadata.name);

    expect(name).toBeInTheDocument();
  });

  test("should accept to delete identity properly", async () => {
    render(<IdentityItem {...defaultProps} />);

    const menu = await screen.findByTestId("menu");
    act(() => {
      menu.click();
    });

    const deleteButton = await screen.findByText("Delete");
    act(() => {
      deleteButton.click();
    });

    const dangerModal = await screen.findByTestId("danger-modal");

    expect(dangerModal).toBeInTheDocument();

    const dangerModalAccept = await screen.findByTestId("danger-modal-accept");
    await act(async () => Promise.resolve(dangerModalAccept.click()));

    expect(defaultProps.onDeleteIdentity).toBeCalledTimes(1);
    expect(defaultProps.onDeleteIdentity).toBeCalledWith(defaultProps.commitment);
    expect(dangerModal).not.toBeInTheDocument();
  });

  test("should reject to delete identity properly", async () => {
    render(<IdentityItem {...defaultProps} />);

    const menu = await screen.findByTestId("menu");
    act(() => {
      menu.click();
    });

    const deleteButton = await screen.findByText("Delete");
    act(() => {
      deleteButton.click();
    });

    const dangerModal = await screen.findByTestId("danger-modal");

    expect(dangerModal).toBeInTheDocument();

    const dangerModalReject = await screen.findByTestId("danger-modal-reject");
    await act(async () => Promise.resolve(dangerModalReject.click()));

    expect(defaultProps.onDeleteIdentity).toBeCalledTimes(0);
    expect(dangerModal).not.toBeInTheDocument();
  });

  test("should select identity properly", async () => {
    render(<IdentityItem {...defaultProps} metadata={defaultProps.metadata} selected={undefined} />);

    const selectIcon = await screen.findByTestId(`identity-select-${defaultProps.commitment}`);
    act(() => {
      selectIcon.click();
    });

    expect(defaultProps.onSelectIdentity).toBeCalledTimes(1);
    expect(defaultProps.onSelectIdentity).toBeCalledWith(defaultProps.commitment);
  });

  test("should rename identity properly", async () => {
    (defaultProps.onUpdateIdentityName as jest.Mock).mockResolvedValue(true);

    render(<IdentityItem {...defaultProps} />);

    const menu = await screen.findByTestId("menu");
    act(() => {
      menu.click();
    });

    const renameButton = await screen.findByText("Rename");
    act(() => {
      renameButton.click();
    });

    const input = await screen.findByDisplayValue(defaultProps.metadata.name);
    fireEvent.change(input, { target: { value: "Account #1" } });

    const renameIcon = await screen.findByTestId(`identity-rename-${defaultProps.commitment}`);
    await act(async () => Promise.resolve(renameIcon.click()));

    expect(defaultProps.onUpdateIdentityName).toBeCalledTimes(1);
    expect(defaultProps.onUpdateIdentityName).toBeCalledWith(defaultProps.commitment, "Account #1");
  });

  test("should go to identity page properly", async () => {
    render(<IdentityItem {...defaultProps} />);

    const menu = await screen.findByTestId("menu");
    act(() => {
      menu.click();
    });

    const button = await screen.findByText("View");
    act(() => {
      button.click();
    });

    expect(mockNavigate).toBeCalledTimes(1);
    expect(mockNavigate).toBeCalledWith(replaceUrlParams(Paths.IDENTITY, { id: defaultProps.commitment }));
  });

  test("should go to host properly", async () => {
    render(<IdentityItem {...defaultProps} onSelectIdentity={undefined} />);

    const icon = await screen.findByTestId("urlOrigin-icon");
    await act(() => Promise.resolve(icon.click()));

    expect(redirectToNewTab).toBeCalledTimes(1);
    expect(redirectToNewTab).toBeCalledWith(mockDefaultConnection.urlOrigin);
  });
});
