/**
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { getLinkPreview } from "link-preview-js";
import { useNavigate } from "react-router-dom";

import { getBandadaUrl } from "@src/config/env";
import { mockDefaultConnection } from "@src/config/mock/zk";
import { Paths } from "@src/constants";
import { closePopup } from "@src/ui/ducks/app";
import { fetchConnections, useConnection } from "@src/ui/ducks/connections";
import { checkGroupMembership, generateGroupMerkleProof } from "@src/ui/ducks/groups";
import { useAppDispatch } from "@src/ui/ducks/hooks";
import { fetchIdentities } from "@src/ui/ducks/identities";
import { rejectUserRequest } from "@src/ui/ducks/requests";
import { useSearchParam } from "@src/ui/hooks/url";
import { redirectToNewTab } from "@src/util/browser";

import { IUseGroupMerkleProofData, useGroupMerkleProof } from "../useGroupMerkleProof";

jest.mock("react-router-dom", (): unknown => ({
  useNavigate: jest.fn(),
}));

jest.mock("link-preview-js", (): unknown => ({
  getLinkPreview: jest.fn(),
}));

jest.mock("@src/ui/hooks/url", (): unknown => ({
  useSearchParam: jest.fn(),
  useUrlParam: jest.fn(),
}));

jest.mock("@src/util/browser", (): unknown => ({
  redirectToNewTab: jest.fn(),
}));

jest.mock("@src/ui/ducks/app", (): unknown => ({
  closePopup: jest.fn(),
}));

jest.mock("@src/ui/ducks/groups", (): unknown => ({
  generateGroupMerkleProof: jest.fn(),
  checkGroupMembership: jest.fn(),
}));

jest.mock("@src/ui/ducks/requests", (): unknown => ({
  rejectUserRequest: jest.fn(),
}));

jest.mock("@src/ui/ducks/hooks", (): unknown => ({
  useAppDispatch: jest.fn(),
}));

jest.mock("@src/ui/ducks/identities", (): unknown => ({
  fetchIdentities: jest.fn(),
}));

jest.mock("@src/ui/ducks/connections", (): unknown => ({
  fetchConnections: jest.fn(),
  useConnection: jest.fn(),
}));

describe("ui/pages/GroupMerkleProof/useGroupMerkleProof", () => {
  const defaultFaviconsData = { favicons: [`${mockDefaultConnection.urlOrigin}/favicon.ico`] };

  const mockNavigate = jest.fn();
  const mockDispatch = jest.fn(() => Promise.resolve(false));

  beforeEach(() => {
    (getLinkPreview as jest.Mock).mockResolvedValue(defaultFaviconsData);

    (useConnection as jest.Mock).mockReturnValue(mockDefaultConnection);

    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

    (useSearchParam as jest.Mock).mockImplementation((arg: string) => arg);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const waitForData = async (data: IUseGroupMerkleProofData): Promise<void> => {
    await waitFor(() => !data.isLoading);
    await waitFor(() => expect(fetchIdentities).toBeCalledTimes(1));
  };

  test("should return initial data", async () => {
    const { result } = renderHook(() => useGroupMerkleProof());
    await waitForData(result.current);

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe("");
    expect(result.current.faviconUrl).toBe(defaultFaviconsData.favicons[0]);
    expect(result.current.groupId).toBe("groupId");
    expect(result.current.connection).toStrictEqual(mockDefaultConnection);
  });

  test("should go back properly", async () => {
    const { result } = renderHook(() => useGroupMerkleProof());
    await waitForData(result.current);

    await act(() => Promise.resolve(result.current.onGoBack()));

    expect(mockNavigate).toBeCalledTimes(1);
    expect(mockNavigate).toBeCalledWith(Paths.HOME);
    expect(mockDispatch).toBeCalledTimes(5);
    expect(fetchIdentities).toBeCalledTimes(1);
    expect(fetchConnections).toBeCalledTimes(1);
    expect(checkGroupMembership).toBeCalledTimes(1);
    expect(rejectUserRequest).toBeCalledTimes(1);
    expect(closePopup).toBeCalledTimes(1);
  });

  test("should handle error properly", async () => {
    const error = new Error("error");
    (useAppDispatch as jest.Mock).mockReturnValue(jest.fn(() => Promise.reject(error)));
    (getLinkPreview as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useGroupMerkleProof());
    await waitForData(result.current);

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(error.message);
    expect(result.current.faviconUrl).toBe("");
  });

  test("should handle empty connected identity properly", async () => {
    (useConnection as jest.Mock).mockReturnValue(undefined);

    const { result } = renderHook(() => useGroupMerkleProof());
    await waitForData(result.current);

    expect(result.current.isLoading).toBe(false);
    expect(result.current.connection).toBeUndefined();
  });

  test("should go to host properly", async () => {
    const { result } = renderHook(() => useGroupMerkleProof());
    await waitForData(result.current);

    await act(() => Promise.resolve(result.current.onGoToHost()));

    expect(redirectToNewTab).toBeCalledTimes(1);
    expect(redirectToNewTab).toBeCalledWith(mockDefaultConnection.urlOrigin);
  });

  test("should go to group properly", async () => {
    const { result } = renderHook(() => useGroupMerkleProof());
    await waitForData(result.current);

    await act(() => Promise.resolve(result.current.onGoToGroup()));

    expect(redirectToNewTab).toBeCalledTimes(1);
    expect(redirectToNewTab).toBeCalledWith(`${getBandadaUrl()}/groups/off-chain/groupId`);
  });

  test("should generate group merkle proof properly", async () => {
    const { result } = renderHook(() => useGroupMerkleProof());
    await waitForData(result.current);

    await act(() => Promise.resolve(result.current.onGenerateMerkleProof()));
    await waitFor(() => !result.current.isSubmitting);

    expect(mockDispatch).toBeCalledTimes(5);
    expect(fetchIdentities).toBeCalledTimes(1);
    expect(fetchConnections).toBeCalledTimes(1);
    expect(checkGroupMembership).toBeCalledTimes(1);
    expect(generateGroupMerkleProof).toBeCalledTimes(1);
    expect(closePopup).toBeCalledTimes(1);
    expect(mockNavigate).toBeCalledTimes(1);
    expect(mockNavigate).toBeCalledWith(Paths.HOME);
  });

  test("should handle generate group merkle proof error properly", async () => {
    const error = new Error("error");
    (useAppDispatch as jest.Mock)
      .mockReturnValueOnce(mockDispatch)
      .mockReturnValue(jest.fn(() => Promise.reject(error)));

    const { result } = renderHook(() => useGroupMerkleProof());

    await act(() => Promise.resolve(result.current.onGenerateMerkleProof()));

    expect(result.current.error).toBe(error.message);
  });
});
